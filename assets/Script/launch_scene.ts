import { Component, _decorator, director, log, sys, v2, view,screen } from "cc";
import { SceneNames } from "./data/const";

const {ccclass, property} = _decorator;

@ccclass
export default class LaunchScene extends Component {

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        
        displayInit();
    }

    start () {
        director.preloadScene(SceneNames.play,null,()=>{
            director.loadScene(SceneNames.play);
        })
    }

    // update (dt) {}
}


function displayInit(){
    let getFrameSize = screen.windowSize;
    let getCanvasSize = screen.windowSize;
    let getScaleX = view.getScaleX();
    let getScaleY = view.getScaleY();
    let getDesignResolutionSize = view.getDesignResolutionSize();
    let getVisibleSize = view.getVisibleSize();
    let getDevicePixelRatio = screen.devicePixelRatio;
    log("--------view",JSON.stringify({
        getFrameSize:getFrameSize,
        getCanvasSize:getCanvasSize,
        getScaleX:getScaleX,
        getScaleY:getScaleY,
        getDesignResolutionSize:getDesignResolutionSize,
        getVisibleSize:getVisibleSize,
        getDevicePixelRatio:getDevicePixelRatio,
    },null,"  "))

    display.width = getVisibleSize.width;
    display.height = getVisibleSize.height;
    display.cx = display.width*0.5;
    display.cy = display.height*0.5;
    display.gapHeight = getVisibleSize.height - getDesignResolutionSize.height;
    
    let langCode = sys.languageCode.toLowerCase();
    langCode = langCode.replace("-","_");//统一用"-"区分
    let arr = langCode.split("_");
    let lang = arr[0];
    let region = langCode.substring(lang.length);
    if(region.substr(0,1)=="_"){
        region = region.substring(1)
    }
    display.sys_lang = lang;
    if(lang=="zh"){//中文还特地在后面标明了简体繁体，去掉，防止PHP不识别
        //示例：zh_cn_#hans zh_us_#hans zh_tw_#hant ja_tw en_tw en_gb en_us
        region = region.replace("hans","");
        region = region.replace("hant","");
        region = region.replace("#","");
        region = region.replace("_","");
        region = region.replace("-","");
        region = region.replace("=","");
    }
    display.sys_region = region
    display.sys_langCode = lang+"_"+region;
    
    let visible = view.getVisibleSize();
    display.aspectRatio = visible.height/visible.width;
    display.isLongScreen = display.aspectRatio>=2.0
}