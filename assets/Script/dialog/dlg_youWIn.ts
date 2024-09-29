import {  Label, _decorator, Sprite, Component, Color} from "cc";
import { BaseDialog } from "./base_dialog";

const {ccclass, property} = _decorator;

export let WaterColors = [
    "#00FF00",
    "#FFFF00",
    "#004616",
    "#BD2656",

    "#7568D8",
    "#DD989D",
    "#EC0000",
    "#DF680F",
]

@ccclass
export class DlgYouWin extends BaseDialog{

    @property(Sprite)
    private hero:Sprite = null;
    @property(Sprite)
    private herobg:Sprite = null;
    @property(Label)
    private text_level:Label = null;

    private onNext:Function = null;
    initView(onNext:Function) {

        this.text_level.string = `恭喜过关`
        this.text_level.color = this.chageColor();
        this.hero.color = this.chageColor();
        
        this.herobg.color = this.chageColor();
        this.onNext = onNext;
    }

    chageColor(){
         //一个纯色 还是 2个纯色
         let color = null;
         let num1 = this.random(1,2)
         if(num1 == 1){
             let num2 = this.random(1,3)
             if(num2 == 1){
                 color = new Color(255, this.random(1,255), this.random(1,255), 255);
             }
             if(num2 == 2){
                 color = new Color(this.random(1,255), 255, this.random(1,255), 255);
             }
             if(num2 == 3){
                 color = new Color(this.random(1,255), this.random(1,255), 255, 255);
             }        
         }
         else{
 
             let num2 = this.random(1,3)
             if(num2 == 1){
                 color = new Color(255, 255, this.random(1,255), 255);
             }
             if(num2 == 2){
                 color = new Color(this.random(1,255), 255, 255, 255);
             }
             if(num2 == 3){
                 color = new Color(255, this.random(1,255), 255, 255);
             }       
 
         }
         return color;
    }

    random(lower, upper) {
        return Math.floor(Math.random() * (upper - lower+1)) + lower;
    }  

    exitView() {
        
    }
    
    onBtn_Next(){
        this.dismiss(true);
        if(this.onNext){
            this.onNext();
        }
    }

    static show(onNext){
        DlgYouWin.create("prefabs/dialog_youWIn",onNext)
    }
}