import { Vec2, v2,Node, game, view, director, UITransform, v3, Vec3, Layers, Canvas, Widget, Camera, Color, renderer } from "cc";
import { EDITOR } from "cc/env";

///全局常驻节点的枚举
export enum GlobalNodeNames{
    PopuMgr = "PopuMgr",
    SoundMgr = "SoundMgr",
    GlobalScheduler = "GlobalScheduler",//全局定时器
}

let zOrder = {
    [GlobalNodeNames.PopuMgr] : 1,
    [GlobalNodeNames.SoundMgr] : 2,
    [GlobalNodeNames.GlobalScheduler] : 3,
    
}


let _globalNode:Node = null;
/**
 * 获得或者生成常驻节点
 */
export function getGlobalNode(type:GlobalNodeNames,offset:Vec3 = v3(0,0)){
    if(_globalNode==null){
        _globalNode = new Node("_globalNode");
        _globalNode.setSiblingIndex(100); 
        _globalNode.layer = Layers.Enum.UI_2D;
        let canvas = _globalNode.addComponent(Canvas);
        canvas.alignCanvasWithScreen = true;
        let widget = _globalNode.addComponent(Widget);
        widget.isAlignLeft = true;
        widget.isAlignRight = true;
        widget.isAlignTop = true;
        widget.isAlignBottom = true;
        widget.left = 0;
        widget.right = 0;
        widget.top = 0;
        widget.bottom = 0;

        let cameraNode = new Node("cameraNode")
        cameraNode.parent = _globalNode;
        let camera = cameraNode.addComponent(Camera);
        camera.visibility = Layers.Enum.UI_2D|Layers.Enum.UI_3D|Layers.Enum.DEFAULT;
        camera.clearFlags = Camera.ClearFlag.SOLID_COLOR;
        camera.clearColor = Color.BLACK;
        camera.far = 2000;
        camera.projection = renderer.scene.CameraProjection.ORTHO;
        camera.near = 0;
        camera.priority= 1073741824 + 1;

        canvas.cameraComponent = camera;

        if(!EDITOR){
            director.addPersistRootNode(_globalNode);
        }
    }
    let size = view.getVisibleSize();

    let tran = _globalNode.getComponent(UITransform)

    tran.setContentSize(size);
    _globalNode.setPosition(size.width/2,size.height/2);
    
    let ret = _globalNode.getChildByName(type);
    if(!ret){
        ret = new Node(type);
        ret.setSiblingIndex(zOrder[type]||0);
        _globalNode.addChild(ret);
    }
    ret.position = v3(offset);
    return ret;
}