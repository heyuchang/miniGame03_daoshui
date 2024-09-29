import { Component, JsonAsset, Layout, Prefab, _decorator, instantiate, sys,Node, UITransform, v2, v3, view, Color, tween, log } from "cc";
import Flask, { FlaskInfo } from "./flask";
import { DEV, EDITOR } from "cc/env";

const { ccclass, property,executeInEditMode } = _decorator;

const COOKIE_LEVEL = "level"
const COOKIE_LAST_CFG = "last_cfg"
const COOKIE_ACTION_HISTORY = "action_history"

// spacesArr 是一个在 flaskMgr 类中定义的对象，用于存储不同数量杯子时，水平布局的间距和缩放比例。具体来说，它是一个键值对对象，其中键是杯子的数量，值是一个数组，包含两个或三个元素：

// 第一个元素是水平间距 spacingX。
// 第二个元素是垂直缩放比例 scale。
// 第三个元素是垂直间距 spacingY（可选）。

const spacesArr = {
    [1] : [0,1],
    [2] : [80,1],
    [3] : [50,1],
    [4] : [40,0.9],
    [5] : [30,0.8],
    [6] : [30,0.65],
    [7] : [20,0.6,60],
    [8] : [10,0.55,80],
}

@ccclass
@executeInEditMode
export class flaskMgr extends Component{
    @property(JsonAsset)
    private levelCfg:JsonAsset = null;
    @property(Prefab)
    private pfb:Prefab = null;

    /**当前等级 */
    private _level = 1;
    private curCfg:Array<FlaskInfo> = [];

    onLoad(){
        if(EDITOR){
            return
        }
        this._level = checkint(sys.localStorage.getItem(COOKIE_LEVEL)||1);
        // this._level = 50
        let str = sys.localStorage.getItem(COOKIE_LAST_CFG);
        if(str){
            try{
                this.curCfg = JSON.parse(str);
            }catch(e){
                this.initCfg()
            }
        }else{
            this.initCfg()
        }
        str = sys.localStorage.getItem(COOKIE_ACTION_HISTORY);
        if(str){
            try{
                this._actions = JSON.parse(str);
            }catch(e){

            }
        }
        this.createCups();
    }

    private initCfg(){
        this.curCfg = [];
        let cfgArr:Array<number> = this.levelCfg.json[this._level-1];//每一关的数据，都是数组，每四个数字代表一杯水
        let acc = 0;
        while(acc<cfgArr.length){
            let info = {
                colorIds:[cfgArr[acc],cfgArr[acc+1]||0,cfgArr[acc+2]||0,cfgArr[acc+3]||0]
            }
            this.curCfg.push(info);
            acc+=4;
        }
    }

    @property private _debugLevel: number = 0;
    @property({ tooltip: DEV && '调试关卡' })
    public get debugLevel() { return this._debugLevel; }
    public set debugLevel(value: number) { 
        this._debugLevel = value;
        this._level = value;
        this.nextLevel()
    }
    
    private _cups:Array<Flask> = [];
    private layout_v:Layout = null;
    private async createCups(){
        if(this.layout_v){
            this.layout_v.node.destroyAllChildren();
        }
        this._cups = [];
        this.selected = null;
        this._actions = [];
        // await wait(1);

        let arr = this.curCfg;
        const len = this.curCfg.length;
        if(len==0){
            return;
        }
        for(let i=0;i<len;i++){
            let info = arr[i];

            let _node = instantiate(this.pfb);
            _node.parent = this.node;
            let _cup = _node.getComponent(Flask)
            _cup.setCupInfo(info,this.onClickCup.bind(this));
            this._cups.push(_cup)
        }

        function _createLayout(type:any,parent:Node,name?:string) {
            let node = new Node(name);
            node.parent = parent;
            node.addComponent(UITransform)
            let layout = node.addComponent(Layout);
            layout.type = type;
            layout.resizeMode = Layout.ResizeMode.CONTAINER;
            return layout
        }
        if(this.layout_v==null){
            this.layout_v = _createLayout(Layout.Type.VERTICAL,this.node,"layout_v");
            this.layout_v.node.setSiblingIndex(1);
        }
                
        let cupSize = this._cups[0].node.getComponent(UITransform).contentSize;
        let cupIdxGroups:Array<Array<number>> = [];
        if(len<=4){
            let idGroup:Array<number> = [];
            for(let i=0;i<this._cups.length;i++){
                idGroup.push(i);
            }
            cupIdxGroups.push(idGroup);
        }else if(len<=15){
            let idGroup:Array<number> = [];
            let i=0;
            let middleId = (len)/2;
            for(;i<middleId;i++){
                idGroup.push(i);
            }
            cupIdxGroups.push(idGroup);
            idGroup = [];
            
            for(;i<len;i++){
                idGroup.push(i);
            }
            cupIdxGroups.push(idGroup);
            idGroup = [];
        }

        let layoutArr:Array<Layout> = [];
        let maxNum = 1;
        for(let i = 0;i<cupIdxGroups.length;i++){
            let node_layout_h = _createLayout(Layout.Type.HORIZONTAL,this.layout_v.node,`layout_h_${i}`);
            node_layout_h.node.getComponent(UITransform).height = cupSize.height;
            let idGroup = cupIdxGroups[i];
            for(let j=0;j<idGroup.length;j++){
                let id = idGroup[j];
                this._cups[id].node.parent = node_layout_h.node;
            }
            maxNum = Math.max(maxNum,node_layout_h.node.children.length);
            let spaceX = spacesArr[maxNum][0];
            if(spaceX!=node_layout_h.spacingX){
                node_layout_h.spacingX = spaceX;
            }
            layoutArr.push(node_layout_h);
        }

        this.layout_v.enabled = true;
        let _scale = spacesArr[maxNum][1];
        this.layout_v.node.scale = v3(_scale,_scale,_scale)
        this.layout_v.spacingY = spacesArr[maxNum][2]||40;

        for(let layout of layoutArr){
            layout.updateLayout();
            layout.enabled = false;
        }
        this.layout_v.updateLayout();
        this.layout_v.enabled = false;
        for(let flask of this._cups){
            (flask as any).orignPt = flask.node.position.clone();
        }
    }

    private selected:Flask = null;
    private onClickCup(flask:Flask){
        if(this.selected){
            if(this.selected==flask){
                this.doSelect(flask,false);
                this.selected = null;
            }else if(this.checkPour(this.selected,flask)){
                this.startPour(this.selected,flask);
            }else{
                this.doSelect(this.selected,false);
                this.selected = null;
            }
        }else{
            this.selected = flask;
            this.doSelect(flask,true);
        }
            
    }

    /**检查两个杯子是否能倒水 */
    private checkPour(src:Flask,dst:Flask){
        let srcTop = src.getTop();
        let dstTop = dst.getTop();
        if(srcTop.topColorId==0){
            return false;
        }
        if(dstTop.topColorId==0){
            return true;
        }
        return srcTop.topColorNum<=dstTop.emptyNum;
    }

    /**开始倒水 */
    private startPour(src:Flask,dst:Flask){
        dst.node.setSiblingIndex(0)
        dst.node.parent.setSiblingIndex(0)
        src.node.setSiblingIndex(10)
        src.node.parent.setSiblingIndex(10)
        let srcTop = src.getTop();
        let dstPt = v3(dst.node.position);
        let dstGlobal = dst.node.parent.getComponent(UITransform).convertToWorldSpaceAR(dstPt)
        let viewSize = view.getVisibleSize()
        let isRight = dstGlobal.x>viewSize.width*0.5;//标记目标是否在屏幕右侧
        if(Math.abs(dstGlobal.x-viewSize.width*0.5)<2){//目标在中间
            let srcPt = src.node.parent.getComponent(UITransform).convertToWorldSpaceAR(v3(src.node.position));
            isRight = srcPt.x<viewSize.width*0.5;
        }
        dstPt.y += 60 + dst.node.getComponent(UITransform).height*0.5;
        let offsetX = 0//dst.node.width*0.5-20;
        dstPt.x = dstPt.x + (isRight?-offsetX:offsetX);

        dstPt = dst.node.parent.getComponent(UITransform).convertToWorldSpaceAR(dstPt);
        
        //将瓶口设置为锚点
        src.setPourAnchor(isRight)
        dstPt = src.node.parent.getComponent(UITransform).convertToNodeSpaceAR(dstPt);
        // log("---------src.x",src.node.x,dstPt.x)

        const flow = src.getFlow();
        flow.node.parent = this.node;

        flow.setLineScale(this.layout_v.node.scale.x)
        const onPourStart = ()=>{
            let startPt = src.node.getComponent(UITransform).convertToWorldSpaceAR(v3())
            startPt = flow.node.parent.getComponent(UITransform).convertToNodeSpaceAR(startPt);
            let endPt = v3(startPt.x,dst.getWaterSurfacePosY());
            endPt = flow.node.parent.getComponent(UITransform).convertToNodeSpaceAR(endPt);
            endPt.x = startPt.x

            flow.strokeColor = new Color().fromHEX(srcTop.colorHex);
            
            flow.playFlowAni(startPt,endPt,0.2,false,()=>{
                dst.startAddWater(srcTop.topColorId,srcTop.topColorNum,(flask:Flask,isFinished:boolean)=>{
                    this.onPourOneFinished(src,dst,srcTop.topColorId,srcTop.topColorNum);
                });
            })
        }
        //倒完水就收回去
        function onPourFinish() {
            let startPt = src.node.getComponent(UITransform).convertToWorldSpaceAR(v3())
            startPt = flow.node.parent.getComponent(UITransform).convertToNodeSpaceAR(startPt);

            let endPt = v3(startPt.x,dst.getWaterSurfacePosY(true));
            endPt = flow.node.parent.getComponent(UITransform).convertToNodeSpaceAR(endPt);
            endPt.x = startPt.x
            
            flow.playFlowAni(startPt,endPt,0.2,true,()=>{
                flow.clear();
            })

            src.setNormalAnchor();

            let pt = (src as any).orignPt;
            let moveBack = tween(src.node)
                .delay(0.7)
                .to(0.5,{position:pt,angle:0},{easing:"sineOut"})
                .call(()=>{
                    src.node.setSiblingIndex(0);
                    src.node.parent.setSiblingIndex(0);
                })
            moveBack.start();
        }
        this.selected = null;

        src.moveToPour(dstPt,isRight,onPourStart.bind(this),onPourFinish.bind(this));
    }

    private doSelect(flask:Flask,bool:boolean){
        let pt = (flask as any).orignPt;
        let y = pt.y+(bool?flask.node.getComponent(UITransform).height*0.2:0);
        tween(flask.node).stop();
        tween(flask.node).to(0.2,{position:v3(pt.x,y)}).start();
    }

    private _actions:Array<Action> = [];
    /**一次倒水完成（以加水那个杯子水面升到最高为界限） */
    private onPourOneFinished(from:Flask,to:Flask,colorId:number,num:number){
        let fromCupIdx = this._cups.indexOf(from);
        let toCupIdx = this._cups.indexOf(to);
        if(this._actions.length==5){
            this._actions.shift()
        }
        this._actions.push({
            from:fromCupIdx,
            to:toCupIdx,
            colorId:colorId,
            num:num
        })

        let isAllFinished = this.checkIsAllFinished();
        if(isAllFinished){
            this._level++;
            sys.localStorage.setItem(COOKIE_LEVEL,this._level+"");
            
            this.node.emit("level_finish")
        }else{
            this.node.emit("do_pour")
        }
        sys.localStorage.setItem(COOKIE_LAST_CFG,JSON.stringify(this.curCfg));
        sys.localStorage.setItem(COOKIE_ACTION_HISTORY,JSON.stringify(this._actions));
    }

    public getActionNum(){
        return this._actions.length;
    }

    /**恢复上一次的操作 */
    public undoAction(){
        let action = this._actions.pop();
        if(action==null){
            return false;
        }
        let {from,to,num,colorId} = action;
        let toCup = this._cups[to];
        let fromCup = this._cups[from];
        if(toCup.isPouring()||fromCup.isPouring()){
            return false;
        }
        toCup.removeTopWaterImmediately(num);
        fromCup.addWaterImmediately(colorId,num);

        return true;
    }
    
    public nextLevel(){
        this.initCfg();
        this.createCups();
    }

    public getLevel(){
        return this._level;
    }

    private checkIsAllFinished(){
        for(let flask of this._cups){
            if(!flask.checkIsFinshed()){
                return false
            }
        }
        return true;
    }
}

interface Action{
    from:number,
    to:number,
    num:number,
    colorId:number,
}

async function wait(sec:number) {
    return new Promise(function (resolve,reject) {
        setTimeout(() => {
            resolve(null);
        }, sec*1000);
    })
}

function checkint(val){
    if(val==null){
        return 0;
    }
    let ret = parseInt(val);
    if(Number.isNaN(ret)){
        ret = 0;
    }
    return ret;
}