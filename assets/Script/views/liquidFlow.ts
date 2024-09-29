import { Graphics, Vec2, Vec3, tween, v2, v3 } from "cc";

const dft_lingWidth = 6;

/**
 * 倾倒的水流
 */
export class LiquidFlow extends Graphics{
    onLoad(){
        super.onLoad()
        this.lineWidth = dft_lingWidth;
        this.lineCap = Graphics.LineCap.ROUND;
    }
    private _toPt:Vec3 = v3()
    public get toPt(){
        return this._toPt
    }
    public set toPt(val){
        Vec3.copy(this._toPt,val)
        this.clear();
        this.moveTo(this.from.x,this.from.y)
        this.lineTo(this._toPt.x,this._toPt.y);
        this.stroke();
    }

    private from:Vec3 = v3();
    /**
     * 倒水水流动画
     * @param from 
     * @param to 
     * @param dur 
     * @param isTail 开始出水false，最后一束水true
     */
    public playFlowAni(from:Vec3,to:Vec3,dur:number,isTail:boolean,onComplete:Function){
        
        this.clear();
        
        let flow:LiquidFlow = this
        if(isTail){
            Vec3.copy(this.from,to);
        }else{
            Vec3.copy(this.from,from);
        }
        this.moveTo(this.from.x,this.from.y)
        let tw = tween(flow)
            .set({toPt:from})
            .to(dur,{toPt:to})
            .call(onComplete)
            .start();
    }

    public setLineScale(scale:number){
        this.lineWidth = dft_lingWidth*scale;
    }
}