import { Button, Component, _decorator } from "cc";
import { AudioEnum, AudioUtil } from "./audio_util";

const {ccclass, property, requireComponent, menu} = _decorator;

@ccclass
@menu("audio/button_click")
@requireComponent(Button)
export default class AudioButtonClick extends Component {    

    onLoad () {
        let btn = this.node.getComponent(Button);
        let hd = new Component.EventHandler() //copy对象
        hd.component = "audio_button_click"
        hd.handler = "onClick"
        hd.target = this.node
        btn.clickEvents.push(hd)

    }

    async onClick(){
        AudioUtil.playEffect(AudioEnum.button)
    }
}
