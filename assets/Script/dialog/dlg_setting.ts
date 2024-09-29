import { Toggle, _decorator } from "cc";
import { BaseDialog } from "./base_dialog";

const {ccclass, property} = _decorator;

@ccclass
export class DlgSetting extends BaseDialog{
    @property(Toggle)
    private check_effect:Toggle = null;
    @property(Toggle)
    private check_shock:Toggle = null;

    static show(){
        DlgSetting.create("prefabs/dialog_setting")
    }

    initView() {
        
    }
    exitView(bundleData?: any) {
        
    }
    
    onToggle_effect(){

    }

    onToggle_shock(){
        
    }

    onBtn_like(){

    }

    onBtn_hideAd(){
        
    }
}