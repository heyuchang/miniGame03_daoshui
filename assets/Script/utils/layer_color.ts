import { _decorator, Component, Node, Sprite, Color, UIOpacity, Tween, tween, UITransform, Layers } from 'cc';
import { createColorSpriteFrame } from './function';
const { ccclass, property } = _decorator;

@ccclass('layer_color')
export class LayerColor extends Node {
    private sprite?:Sprite = null;
    private uiOp?:UIOpacity = null;
    private trans:UITransform = null;
    constructor(color = Color.WHITE){
        super("layer_color");
        this.layer = Layers.Enum.UI_2D;
        this.trans = this.addComponent(UITransform)
        this.sprite = this.addComponent(Sprite);
        // this.sprite.spriteFrame = createColorSpriteFrame();
        this.sprite.color = color;

        this.uiOp = this.addComponent(UIOpacity)
    }

    get opacity (){
        return this.uiOp.opacity
    }
    set opacity (val){
        this.uiOp.opacity = val
    }

    get size (){
        return this.trans.contentSize
    }
    set size (val){
        this.trans.contentSize = val
    }


    private _tw?:Tween<UIOpacity> = null;
    fadeTo(time:number,opacity:number,fromOpacity = null,callback=null){
        if(fromOpacity){
            this.opacity = fromOpacity;
        }
        if(this._tw){
            this._tw.stop();
        }
        this._tw = tween(this.uiOp).to(time,{
            opacity:opacity
        })
        if(callback){
            this._tw = this._tw.call(callback)
        }
        this._tw.start()
    }

    fadeIn(time:number,callback=null){
        if(this._tw){
            this._tw.stop();
        }
        this._tw = tween(this.uiOp).to(time,{
            opacity:255
        })
        if(callback){
            this._tw = this._tw.call(callback)
        }
        this._tw.start()
    }

    fadeOut(time:number,callback=null){
        if(this._tw){
            this._tw.stop();
        }
        this._tw = tween(this.uiOp).to(time,{
            opacity:0
        })
        if(callback){
            this._tw = this._tw.call(callback)
        }
        this._tw.start()
    }
}

