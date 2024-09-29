import { Component, Enum, Prefab, Tween, UIOpacity, UITransform, Vec2, Vec3, _decorator, tween, v2, v3,Node } from "cc";


let ANIM_TAG = 10087;

let ScaleSize = 0.5;

export enum WindowStyle {
    POPUP,
    NORMAL,
};
const {ccclass, property} = _decorator;
@ccclass
export abstract class BaseDialog extends Component{
    private m_manager:any = null;
    private m_isInAnim:boolean = false;
    private _tag:any = "";
    public get tag(){return this._tag;}
    protected isPfbRaw:boolean = false; //为true时,tag表示路径

    @property({
        type:Enum(WindowStyle),
        tooltip:"弹窗样式,POPUP有弹窗动画，NORMAL直接显示"
    })
    public style:WindowStyle = WindowStyle.POPUP;
    @property({
        tooltip:"是否点击背后隐藏"
    })
    public closeByTouchBg = true;
    @property({
        tooltip:"是否点击返回键隐藏"
    })
    public closeByTouchBack = true;
    @property(Vec2)
    private offset = v2(0,0);
    @property({
        tooltip:"黑色半透明遮罩的透明度"
    })
    public maskOpacity = 128;
    @property({
        tooltip:"是否全屏"
    })
    public isFullScreen = false;

    /**是否正在做弹窗动画，此时点击关闭背景无效 */
    public get isPupuAni(){
        return this.m_isInAnim;
    }

    /**显示弹窗，为避免死锁，在popuManager里实现 */
    static async create<T>(pfb:string|Prefab,param?:T|any,...args):Promise<BaseDialog>{
        // PopupMgr.getInstance().showWindow(pfb,param)
        return null;
    }

    ///屏蔽父类的onLoad，事件注册在PopupMgr里处理了
    onLoad(){
        if(this.isFullScreen){
            this.node.getComponent(UITransform).width = display.width;
            this.node.getComponent(UITransform).height = display.height;
        }else{
            this.node.position = new Vec3(this.offset.x,this.offset.y);
        }
    }
    ///屏蔽父类的onDestroy，事件注销在PopupMgr里处理了
    onDestroy(){
        this.exitView();
        // let config = this.getRawAssetsConfig();
        // if(this.isPfbRaw){
        //     config.prefab = this.tag;
        // }
        // super.onDestroy();
    }

    /**销毁前调用，有需要在销毁时刻运用节点树的资源时重写这个*/
    onPreDestroy(){

    }

    /**获取弹窗出现时的动画 */
    protected getShowAnim():Tween<Node>{
        return null;
    }

    /**获取弹窗关闭时的动画 */
    protected getHideAnim():Tween<Node>{
        return null;
    }

    protected getDftShowAni(duration: number = 0.3){
        // 播放弹窗主体动画
        let tw = tween(this.node)
        .call(()=>{
            let opa = this.node.getComponent(UIOpacity)||this.node.addComponent(UIOpacity);
            tween(opa)
                .set({opacity:0})
                .to(duration,{opacity:255}, { easing: 'backOut' })
        })
        .set({scale:v3(0.5,0.5,0.5)})
        .to(duration,{scale:v3(1,1,1) }, { easing: 'backOut' })

        
        return tw
    }

    protected getDftHideAni(duration: number = 0.3){
        // 播放弹窗主体动画
        let tw = tween(this.node)
        .call(()=>{
            let opa = this.node.getComponent(UIOpacity)||this.node.addComponent(UIOpacity);
            tween(opa)
                .to(duration,{opacity:0}, { easing: 'backIn' })
        })
        .to(duration,{scale:v3(0.5,0.5,0.5) }, { easing: 'backIn' })
        
        return tw
    }

    // /**初始化资源，用于加载和释放 */
    // protected getRawAssetsConfig():_RawAssetsConfig{
    //     return {}
    // }

    initWindow(manager:any,tag,isPfbRaw:boolean,onLoadComplete:Function){
        this.m_manager = manager;
        this.m_isInAnim = false;//是否正在做动画
        this._tag = tag;
        this.isPfbRaw = isPfbRaw;

        // _loadRawAssets(this.getRawAssetsConfig(),(result)=>{
        //     if(result=="complete"){
                onLoadComplete();
        //     }
        // })
    }

    abstract initView(bundleData?:any,arg1?:any,arg2?:any,arg3?:any);
    abstract exitView(bundleData?:any);
    refreshView(bundleData?:any,arg1?:any,arg2?:any,arg3?:any){}
    
    showWindow(bundleData:any,arg1?:any,arg2?:any,arg3?:any){ 
        this.initView(bundleData,arg1,arg2,arg3);

        //播放动画
        if(this.m_isInAnim || !this.node.active)
            return;
        this.node.setScale(v3(1,1,1));
        Tween.stopAllByTag(ANIM_TAG,this.node)
        let _action = this.getShowAnim();
        if(_action==null&&this.style==WindowStyle.POPUP){
            _action = this.getDftShowAni();
        }
        if(_action){
            _action.tag(ANIM_TAG);
            _action.call(()=>{
                this.onShowEnd();
            })
            .start()
        }else{
            this.onShowEnd();
        }
    }
    onShowEnd(){
        this.m_isInAnim = false;
    }
    dismiss(noAnim:boolean = false,data?:any){
        if(noAnim){
            this.onHideEnd(data);
            return;
        }
        if(this.m_isInAnim)
            return;
            this.node.setScale(v3(1,1,1));
            Tween.stopAllByTag(ANIM_TAG,this.node)

        let _action = this.getHideAnim();
        if(_action==null&&this.style==WindowStyle.POPUP){
            _action = this.getDftHideAni();
        }
        if(_action){
            _action.tag(ANIM_TAG);
            this.m_isInAnim = true;
            
            _action.call(()=>{
                this.onHideEnd(data);
            })
            .start()
        }else{
            this.onHideEnd(data);
        }
    }

    private _onClosed:Function = null;
    public setOnClosed(func:Function){
        this._onClosed = func;
    }

    protected onHideEnd(data?:any){
        this.m_isInAnim = false;
        this.node.active = false;
        if(this._onClosed){
            this._onClosed(this);
            this._onClosed = null;
        }
        if(this.m_manager&&this.m_manager.node.active){
            this.m_manager.onHideEnd(this);
        }
    }

    protected onBtnClose(){
        this.dismiss();
    }
}