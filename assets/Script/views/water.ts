import { Color, Component, EffectAsset, Label, Material, Sprite, UITransform, v2,Node, v3, _decorator, Vec4, color, v4, log } from "cc";
import { DEV, EDITOR } from "cc/env";

const { ccclass, property, requireComponent, executeInEditMode, disallowMultiple, executionOrder } = _decorator;

export interface WaterInfo{
    colorId:number,
    color:Color,//颜色
    height:number,//默认情况下，占杯子的高度
}

const MAX_ARR_LEN = 6;

enum PourAction{
    none,
    /**往里加水 */
    in,
    /**向外倒水 */
    out,
} 

@ccclass
@requireComponent(Sprite)
@executeInEditMode
@disallowMultiple
@executionOrder(-100)
export default class Water extends Component {
    private _action:PourAction = PourAction.none;
    private infos:WaterInfo[] = [];
    /**到这里停止倒水 */
    private stopIdx = -1;
    /**当前是有几层水 */
    private curIdx = 0;

    /**节点高宽比 */
    private _ratio:number = 1;
    @property(EffectAsset)
    private effect:EffectAsset = null;
    @property private _skewAngle: number = 0;
    @property({ tooltip: DEV && '旋转角度' })
    public get skewAngle() { return this._skewAngle; }
    public set skewAngle(value: number) { 
        value = Math.round(value*100)/100;
        // log("angle",value)
        this._skewAngle = value; 
        this.updateAngleHeight();
    }

    private _material: Material = null;
    private get material(){
        if(this._material==null){
            let sp = this.node.getComponent(Sprite);
            if(sp){
                if (sp.spriteFrame) sp.spriteFrame.packable = false;
                // 生成并应用材质
                if(this.effect){
                    this._material = new Material();
                    this._material.initialize({
                        effectAsset:this.effect
                    })
                    sp.setMaterial( this._material,0);
                }
                this._material = sp.getSharedMaterial(0)
                this._material.setProperty("mainTexture",sp.spriteFrame.texture)
            }
        }

        return this._material
    }

    protected onLoad() {
        this._ratio = this.node.getComponent(UITransform).height/this.node.getComponent(UITransform).width;
    }

    public initInfos(infos:Array<WaterInfo>){
        this.infos = infos;
        this.curIdx = this.infos.length-1;

        this.initSizeColor();
        this.updateAngleHeight();
    }

    private addHeight = 0;
    public addInfo(info:WaterInfo){
        this.addHeight = info.height;
        info.height = 0;
        this.infos.push(info);
        this._action = PourAction.in;
        this.curIdx = this.infos.length-1;

        this.initSizeColor();
    }

    private onOutStart:Function = null;
    private onOutFinish:Function = null;
    public setPourOutCallback(onOutStart:Function,onOutFinish:Function){
        this.onOutStart = onOutStart;
        this.onOutFinish = onOutFinish;
    }

    private onInFInish:Function = null;
    public setPourInCallback(onInFInish:Function){
        this.onInFInish = onInFInish;
    }

    /**
     * 倾斜到哪个角度开始往外边倒水
     */
    public getPourStartAngle(){
        let _height = 0;
        for(let i=0;i<=this.curIdx;i++){
            _height+=this.infos[i].height;
        }
        
        return this.getCriticalAngleWithHeight(_height);
    }

    /**
     * 倾斜到哪个角度开始停止倒水（当前颜色的水倒完了）
     */
    public getPourEndAngle(){
        this.stopIdx = this.curIdx-this.getTopSameColorNum();

        let _height = 0;
        for(let i=0;i<=this.stopIdx;i++){
            _height+=this.infos[i].height;
        }
        
        return this.getCriticalAngleWithHeight(_height);
    }

    /**获取某一高度的水刚好碰到瓶口的临界倾斜角度 */
    private getCriticalAngleWithHeight(_height){
        
        let ret = 0;
        if(_height==0){
            ret = 90;
            return ret;
        }

        if(_height<0.5){//水的体积小于杯子的一半,先碰到下瓶底
            let tanVal = this._ratio/(_height*2.0);
            ret = Math.atan(tanVal);
        }else{
            let tanVal = 2.0*this._ratio*(1.0-_height); 
            ret = Math.atan(tanVal);
        }
        ret = radian2angle(ret);
        return ret;
    }

    private getTopSameColorNum(){
        let sameColorNum = 0;
        let colorId=null;
        for(let i=this.curIdx;i>=0;i--){
            if(colorId==null){
                sameColorNum++;
                colorId = this.infos[i].colorId;
            }else if(this.infos[i].colorId==colorId){
                sameColorNum++;
            }else{
                break;
            }
        }
        return sameColorNum
    }

    /**
     * 开始倒水
     * 一直倒水直到不同颜色的水到达瓶口，为当前最大能倾斜的角度
     * @returns 返回值为倾斜角度的绝对值
     */
    public onStartPour(){
        this._action = PourAction.out;
        
        this.stopIdx = this.curIdx-this.getTopSameColorNum();
    }

    update(){
        if(this._action==PourAction.out){
            this.pourStep();
        }else if(this._action==PourAction.in){
            this.addStep()
        }
    }

    /**
     * 每帧调用，升高水面高度
     */
    addStep(){
        if(this.curIdx<0){
            return;
        }
        let info = this.infos[this.curIdx];
        info.height = Math.round((info.height + 0.005)*1000)/1000;
        // log("--------info.height",info.height)
        if(info.height>=this.addHeight){
            info.height = this.addHeight;
            this._action = PourAction.none;
            if(this.onInFInish){
                this.onInFInish();
                this.onInFInish = null;
            }
        }

        this.updateAngleHeight();
    }

    /**
     * * 每帧调用
     * * 降低水面高度 
     */
    pourStep(){
        if(this.curIdx<0){
            this._action = PourAction.none;
            return;
        }
        let _height = 0;
        for(let i=0;i<=this.curIdx;i++){
            _height+=this.infos[i].height;
        }
        let is_top = false;
        let angle = (this.skewAngle%360) * Math.PI / 180.0
        let _t = Math.abs(Math.tan(angle));
        if(_height<0.5){//水的体积小于杯子的一半,先碰到下瓶底
            is_top = _t>(this._ratio)/(_height*2.0);
        }else{
            is_top = _t>2.0*this._ratio*(1.0-_height);
        }

        let info = this.infos[this.curIdx];
        if(!is_top){//没到瓶口，不往下倒
            if(info.height<0.05){//可能还留了一点点水,要继续倒出去
                
            }else{
                return;
            }
        }
        if(this.onOutStart){
            this.onOutStart();
            this.onOutStart = null;
        }
        
        info.height = Math.round((info.height - 0.005)*1000)/1000;
        if(info.height<0.01){
            info.height = 0;

            this.infos.pop();
            this.curIdx--;
            // log("------this.curIdx",this.curIdx,this.stopIdx)
            if(this.curIdx==this.stopIdx){
                if(this.onOutFinish){
                    this.onOutFinish();
                    this.onOutFinish = null;
                }
                this._action = PourAction.none;
            }
        }
        // log("this.curIdx",this.curIdx,"info.height",info.height.toFixed(2),"angle",this.skewAngle.toFixed(2))
        this.updateAngleHeight();
    }

    private initSizeColor(){
        for(let i=0;i<this.infos.length;i++){
            const c = this.infos[i].color; 
            this.material.setProperty('color'+i, c);
        }
        let size = v2(this.node.getComponent(UITransform).width,this.node.getComponent(UITransform).height)
        this.material.setProperty('sizeRatio', size.y/size.x);
        this.material.setProperty('waveType', 0);
        this.material.setProperty("layerNum",this.infos.length)
    }

    private updateAngleHeight() { 
        for(let i=0;i<6;i++){
            if(i<this.infos.length){
                let h = this.infos[i].height;
                this.material.setProperty('height'+i, h);
            }else{
                this.material.setProperty('height'+i, 0);
            }
        }
        
        let radian = angle2radian(this._skewAngle)
        this.material.setProperty('skewAngle', radian*1.0);

        let waveType = 0.0;
        if(this._action==PourAction.in){
            waveType = 1.0;
        }else if(this._action==PourAction.out){
            waveType = 2.0;
        }
        this.material.setProperty('waveType', waveType);
        this.material.setProperty("layerNum",this.infos.length)
        
        this.showDebugCenter();
    }

    private dot:Node = null;
    /**显示水面的中心点，调试shader脚本用 */
    private showDebugCenter(){
        if(EDITOR){
            return;
        }
        if(this.dot==null){
            this.dot = new Node();
            this.dot.parent = this.node;
            this.dot.addComponent(UITransform)
            let label = this.dot.addComponent(Label);
            label.string = "·";
            label.fontSize = 60;
            label.color = Color.RED;
        }

        let ratio = this.node.getComponent(UITransform).height/this.node.getComponent(UITransform).width;
        let angle = angle2radian(this.skewAngle);
        let _height = 0;
        if(this.curIdx>=this.infos.length){
            return
        }
        for(let i=0;i<=this.curIdx;i++){
            _height+=this.infos[i].height;
        }
        
        let toLeft = Math.sin(angle)>=0.0;
        let center = v2(0.5,1.0-_height);//水面倾斜时，以哪个店为中心店

        let _t = Math.abs(Math.tan(angle));
        if(_height<=0.5){//水的体积小于杯子的一半,先碰到下瓶底
            let is_bottom = _t>ratio*2.0*_height;//倾斜角度达到瓶底
            if(is_bottom){
                center.x = Math.sqrt((2.0*_height/_t)*ratio)/2.0;
                center.y = 1.0 - Math.sqrt((2.0*_height*_t)/ratio)/2.0;

                let is_top = _t>(ratio)/(_height*2.0);//倾斜角度达到瓶口
                if(is_top){
                    center.y = 0.5;
                    center.x = _height;
                }
            }
            if(!toLeft){
                center.x = 1.0-center.x;
            }
            if(Math.abs(center.x-0.25)<0.01){
                let i = 0;
            }
            // log("aa-------center",center.x.toFixed(2),center.y.toFixed(2));
        }else{//水比较多，先碰到上瓶底
            let is_top = _t>2.0*ratio*(1.0-_height);
            if(is_top){
                center.x = Math.sqrt(2.0*ratio*(1.0-_height)/_t)/2.0;
                center.y = Math.sqrt(2.0*ratio*(1.0-_height)*_t)/2.0/ratio;
                let is_bottom = _t>ratio/(2.0*(1.0-_height));
                if(is_bottom){
                    center.y = 0.5;
                    center.x = 1.0-_height;
                }
            }else{
            }

            if(toLeft){
                center.x = 1.0-center.x;
            }
            // log("bb-------center",center.x.toFixed(2),center.y.toFixed(2));
        }
        center.x = center.x - 0.5;
        center.y = -center.y + 0.5;
        let pt = v3(center.x*this.node.getComponent(UITransform).width,center.y*this.node.getComponent(UITransform).height);
        this.dot.position = pt;
    }
}

function angle2radian(angle:number){
    while(angle>360){
        angle-=360;
    }
    while(angle<-360){
        angle+=360;
    }
    return (angle%360) * Math.PI / 180.0;
}

function radian2angle(radian:number) {
    return radian/Math.PI*180;
}