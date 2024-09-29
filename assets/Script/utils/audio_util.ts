import { _decorator,AudioClip,AudioSource,Canvas,director,isValid,Node, resources } from "cc";
import { getGlobalNode, GlobalNodeNames } from "../global_node";

const { ccclass, property } = _decorator;

export enum AudioEnum{
    button = "audio/Button_Click",
    finishOne = "audio/ContainerFinish",
    pourWater = "audio/pourWater",
    youWin = "audio/Show_Victory",
}

export class AudioUtil{
    static preloadAll(){
        let arr = [];
        for(let key in AudioEnum){
            let path = AudioEnum[key];
            arr.push(path)
        }
        resources.preload(arr);
    }
    static unloadAll(){
        for(let key in AudioEnum){
            let path = AudioEnum[key];
            resources.release(path,AudioClip);
        }
    }

    private static _as:AudioSource = null;
    private static get as(): AudioSource{
        if(isValid(this._as)){
            return this._as
        }
        let audioNode = getGlobalNode(GlobalNodeNames.SoundMgr);
        let node = audioNode;
        
        let as = node.getComponent(AudioSource)
        if(!as){
            as = node.addComponent(AudioSource)
        }
        
        return as;
    }

    static async playEffect(path:AudioEnum|string,volume=1){
        let clip = await this.loadClip(path);
        this.as.clip = clip;
        this.as.loop = false;
        this.as.volume = volume;
        this.as.play()
    }

    /**
     * 播放倒水声音，根据倒水容量播放不同的时间
     * @param time 【0,1】
     */
    static async playPourWaterEffect(time:number){
        let clip = await this.loadClip(AudioEnum.pourWater);
        this.as.clip = clip;
        this.as.loop = false;
        this.as.volume = 1;
        this.as.play()

        let dur = 3.0*time;
        setTimeout(() => {
            this.as.stop()
        }, dur*1000);
    }

    private static  async loadClip(path:string){
        return new Promise<AudioClip>(function (resove,reject) {
            resources.load(path,AudioClip,(err:Error,clip:AudioClip)=>{
                if(err){
                    // reject(err)
                    resove(null)
                }else{
                    resove(clip)
                }
            })
        })
    }
}