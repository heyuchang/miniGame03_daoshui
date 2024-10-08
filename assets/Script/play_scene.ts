
import { Component, Label, _decorator, Sprite, resources, sp,SpriteFrame, Color, SubContextView} from "cc";

import { DlgSetting } from "./dialog/dlg_setting";
import { DlgYouWin } from "./dialog/dlg_youWIn";
import { AudioEnum, AudioUtil } from "./utils/audio_util";
import { flaskMgr } from "./views/flaskMgr";


const {ccclass, property} = _decorator;

@ccclass
export default class PlayScene extends Component {
    @property(flaskMgr)
    private flaskMgr: flaskMgr = null;
    @property(Label)
    private text_level:Label = null;
    @property(Label)
    private text_actionNum:Label = null;
    @property(Sprite)
    private bg:Sprite = null;

    onLoad(){
        this.flaskMgr.node.on("level_finish",this.onFinishOneLevel,this);
        this.flaskMgr.node.on("do_pour",this.onPourAction,this);
    }

    onDestroy(){
        this.flaskMgr.node.off("level_finish",this.onFinishOneLevel,this);
        this.flaskMgr.node.off("do_pour",this.onPourAction,this);
    }

    start(){



        let sken1 = this.node.getChildByName('hero_spine').getComponent(sp.Skeleton);

        let number = this.random(1,4)
        if(number == 1){
            sken1.setAnimation(0, 'run_loop', true);
        }
        if(number == 2){
            sken1.setAnimation(0, 'run_loop', true);
        }
        if(number == 3){
            sken1.setAnimation(0, 'standby_loop', true);
        }
        if(number == 4){
            sken1.setAnimation(0, 'run_loop', true);
        }


        this.text_level.string = `第${this.flaskMgr.getLevel()}关`
        this.text_actionNum.string = this.flaskMgr.getActionNum()+'';
        this.text_level.color = new Color(this.random(1,255), this.random(1,255), this.random(1,255), 255);
        this.setBgSpriteFrame();
    }

    setBgSpriteFrame(){
        this.bg.color = new Color(this.random(1,255), this.random(1,255), this.random(1,255), this.random(190,255));
    }

    /**
     * 产生随机整数，包含下限值，包括上限值
     * @param {Number} lower 下限
     * @param {Number} upper 上限
     * @return {Number} 返回在下限到上限之间的一个随机整数
     */
    random(lower, upper) {
        return Math.floor(Math.random() * (upper - lower+1)) + lower;
    }  
 
    onFinishOneLevel(){
        AudioUtil.playEffect(AudioEnum.youWin);
        DlgYouWin.show(()=>{
            this.flaskMgr.nextLevel()
            this.text_level.string = `第${this.flaskMgr.getLevel()}关`
            this.text_actionNum.string = this.flaskMgr.getActionNum()+'';
            this.setBgSpriteFrame();
        })
    }

    onPourAction(){
        this.text_actionNum.string = this.flaskMgr.getActionNum()+'';
    }

    onBtn_restart(){
        this.flaskMgr.nextLevel();
        this.text_actionNum.string = this.flaskMgr.getActionNum()+'';
    }

    onBtn_recover(){
        this.flaskMgr.undoAction();
        this.text_actionNum.string = this.flaskMgr.getActionNum()+'';
    }

    onBtn_tip(){

    }

    onBtn_setting(){
        DlgSetting.show();
    }
}
