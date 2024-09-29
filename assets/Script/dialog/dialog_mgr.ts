import { _decorator, Widget,Node, Component, color, Prefab, log, instantiate, isValid, resources, director, EventTouch } from "cc";
import { getGlobalNode, GlobalNodeNames } from "../global_node";
import { LayerColor } from "../utils/layer_color";
import { BaseDialog, WindowStyle } from "./base_dialog";


export interface ShowWindowArgs{
    style?:WindowStyle,//弹窗风格
    maskOpacity?:number,//黑色半透明遮罩的透明度
    
    closeByTouchBg?:boolean,//是否点击背后隐藏
    closeByTouchBack?:boolean,//是否点击返回键隐藏
}

const {ccclass, property} = _decorator;


function applyWidget(node:Node){
    let widget =  node.getComponent(Widget);
    if(widget==null){
        widget = node.addComponent(Widget);
    }
    widget.bottom = 0;
    widget.top = 0;
    widget.left = 0;
    widget.right = 0;
    widget.isAlignBottom = true;
    widget.isAlignTop = true;
    widget.isAlignLeft = true;
    widget.isAlignRight = true;

    widget.updateAlignment();
}

export class PopupMgr extends Component{
    static EVT_POPO_OPEN_FRIST = "EVT_POPO_OPEN_FRIST";
    static EVT_POPO_CLOSE_LAST = "EVT_POPO_CLOSE_LAST";
    static getInstance():PopupMgr{
        let _node = getGlobalNode(GlobalNodeNames.PopuMgr);//挂在常驻节点上
        let ret = _node.getComponent(PopupMgr)
        if(ret==null){
            applyWidget(_node);
            ret = _node.addComponent(PopupMgr)
            ret.createMaskNode();
        }
        return ret;
    }
    @property
    m_popups:Array<BaseDialog> = []//存放弹窗

    onLoad(){

    }
    onDestroy(){

    }

    private maskBg:LayerColor = null;
    ///创建蒙版
    private createMaskNode():LayerColor{
        this.maskBg = new LayerColor(color(0,0,0));
        this.maskBg.opacity = 0;
        this.node.addChild(this.maskBg)
        return this.maskBg;
    }

    //显示弹窗
    async showWindow<T>(param:string|Prefab,bundleData?:T|any,...args):Promise<BaseDialog>{
        return new Promise<BaseDialog>((resolve,reject)=>{
            if(param==null){
                reject();
                return;
            }
            let _prefab:Prefab;
            if(param instanceof Prefab){
                _prefab = param;
            }else if(typeof(param)=="string" ){
    
            }
            if(_prefab!=null){
                let popu = this.createWindowByPrefab(_prefab,_prefab.name,false,bundleData,...args);
                resolve(popu);
            }else{
                let path = param as string;
                if(!path){
                    reject();
                    return;
                }
                let popu = PopupMgr.getInstance().getWindowByTag(path);
                if(popu){
                    popu.refreshView(bundleData,...args);
                    let zindex = popu.node.getSiblingIndex()+1
                    popu.node.setSiblingIndex(zindex);
                    resolve(popu);
                    return;
                }
                let url = path;
                _prefab = resources.get(url,Prefab) as Prefab;
                if(_prefab){
                    setTimeout(()=>{
                        let popu = this.createWindowByPrefab(_prefab,path,true,bundleData,...args);
                        resolve(popu);
                    })
                }else{
                    resources.load(url,Prefab,(error,_prefab:Prefab)=>{
                        if(error){
                            reject();
                            return;
                        }
                        let popu = this.createWindowByPrefab(_prefab,path,true,bundleData,...args);
                        resolve(popu);
                    });
                }
                    
            }
        }); 
    }
    //从prefab文件实例化为弹窗节点
    //isPfbRaw,是动态加载的prefab,关闭后释放
    private createWindowByPrefab(_prefab:Prefab,tag:string,isPfbRaw:boolean,bundleData:any,...args):BaseDialog{
        if(!isValid(this)){
            return null;
        }
        let popu = PopupMgr.getInstance().getWindowByTag(tag);
        if(popu){
            popu.refreshView(bundleData,...args);
            return null;
        }
        let node = instantiate(_prefab);
        if(node==null){
            return null;
        }
        node.setPosition(0,0);
        let popup = node.getComponent(BaseDialog as any) as any;
        if(!popup){
            return null;
        }
        popup.initWindow(this,tag,isPfbRaw,()=>{
            this.realShow(popup,bundleData,...args);
        });
        return popup
    }

    private _isMaskOn = false;
    ///将实例化好的弹窗添加到节点树
    private realShow(popup:BaseDialog,bundleData:any,...args){
        // if(!this._isMaskOn){
            this.maskBg.off(Node.EventType.TOUCH_START,this.onBgTouch,this);
            this.maskBg.on(Node.EventType.TOUCH_START,this.onBgTouch,this);
            if(popup.maskOpacity){
                let fadetime = popup.style==WindowStyle.POPUP?0.2:0;
                if(director.isPaused()){
                    this.maskBg.opacity = popup.maskOpacity;
                }else{
                    this.maskBg.fadeTo(fadetime,popup.maskOpacity,0);
                }
                
            }
            
            this._isMaskOn = true;
        // }
        let zOrder = 0;
        if(this.m_popups.length==0){
            this.node.emit(PopupMgr.EVT_POPO_OPEN_FRIST);
        }else{
            zOrder = this.m_popups[this.m_popups.length-1].node.getSiblingIndex();
        }
        this.maskBg.setSiblingIndex(zOrder)
        this.maskBg.setSiblingIndex(zOrder+1)
        popup.node.setSiblingIndex(zOrder+1);
        this.node.addChild(popup.node);
        popup.showWindow(bundleData,...args);

        this.m_popups.push(popup);
    }

    onBgTouch(event:EventTouch){
        for(let i=this.m_popups.length-1;i>=0;i--){
            let popup = this.m_popups[i];
            if(isValid(popup.node)&&popup.node.active){
                if(popup.closeByTouchBg&&!popup.isPupuAni){
                    popup.dismiss();
                }
                return;
            }
        }
    }
    /**
     * 返回true表示不往下传递
     */
    onBack(){
        let ret = false
        if(!isValid(this)||!this.node.active)
            return ret;
        for(let i=this.m_popups.length-1;i>=0;i--){
            do{
                let popup = this.m_popups[i];
                if(!isValid(popup.node))
                    break;
                if(!popup.node.active){
                    break;
                }else if(!popup.closeByTouchBack||popup.isPupuAni){//有弹窗，但是这个弹窗不响应返回键
                    ret = true;
                }else{
                    ret = true;
                    popup.dismiss();
                }
            }while(false)
            if(ret)
                break;
        }
        return ret
    }
    onHideEnd(popup:BaseDialog){
        for(let i = 0;i<this.m_popups.length;i++){
            if(this.m_popups[i]===popup){
                this.m_popups.splice(i,1);
                popup.onPreDestroy();
                popup.node.destroy();
                break
            }
        }
        if(this.m_popups.length==0){
            this.maskBg.setSiblingIndex(0)
        }else{
            let zOrder = this.m_popups[this.m_popups.length-1].node.getSiblingIndex()-1;
            if(zOrder<0){
                zOrder = 0;
            }
            this.maskBg.setSiblingIndex(zOrder);
            this.m_popups[this.m_popups.length-1].node.setSiblingIndex(zOrder+1)
        }
        

        if(this.m_popups.length==0){
            if(director.isPaused()){
                this.maskBg.opacity = 0;
            }else{
                this.maskBg.fadeOut(popup.style==WindowStyle.POPUP?0.2:0.1);
            }
            this.maskBg.off(Node.EventType.TOUCH_START,this.onBgTouch,this);
            this.node.emit(PopupMgr.EVT_POPO_CLOSE_LAST);
            this._isMaskOn = false;
        }
    }
    public getVisibleCount():number{
        let num = 0;
        for(let _popup of this.m_popups){
            let node = _popup.node;
            if(isValid(node)&&node.active){
                ++num;
            }
        }
        return num;
    }
    closeWindowByTag(tag:any,noAnim:boolean = true){
        for(let popup of this.m_popups){
            if(isValid(popup.node)&&popup.tag==tag){
                popup.dismiss(noAnim);
                break;
            }
        }
    }
    getWindowByTag(tag:any):BaseDialog{
        for(let popup of this.m_popups){
            if(isValid(popup.node)&&popup.tag==tag){
                return popup;
            }
        }
        return null;
    }
    /**移除所有弹窗 */
    removeAllPopup(){
        while(this.m_popups.length>0){
            let popup = this.m_popups[0];
            popup.dismiss(true);
        }
    }
}

BaseDialog.create = function<T>(pfb:string|Prefab,param:T|any,...args):Promise<BaseDialog> {
    return PopupMgr.getInstance().showWindow(pfb,param,...args)
}