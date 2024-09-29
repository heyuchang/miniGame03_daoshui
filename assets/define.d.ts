declare namespace display{
    let width:number;
    let height:number;
    let cx:number;
    let cy:number;
    /**实际高度减去设计分辨率高度 */
    let gapHeight:number;
    /**实际分辨率比设计分辨率，缩放系数 */
    let screenScale:cc.Vec2;
    /**屏幕高宽比 */
    let aspectRatio:number;
    /**是否是长屏幕（目前是判断aspectRatio>=2.0） */
    let isLongScreen:boolean;
    /**系统语言 zh,en */
    let sys_lang:string;
    /**系统地区,cn,hk,tw,us */
    let sys_region:string;
    /**系统的 语言_地区 zh_cn,zh_hk,en_us*/
    let sys_langCode:string;
    
    /**是否在后台运行 */
    let isInBackground:boolean;
}