import { Color, ImageAsset, Rect, Size, SpriteFrame, Texture2D, color, rect, size, view } from "cc";

export function createTexture(_color:Color=color(255,255,255,255),_size:Size=size(6,6)) {
    let width = _size.width;
    let height = _size.height;
    let tex = new Texture2D();
    let buf = new ArrayBuffer(width*height*4);
    let arr = new Uint8Array(buf);

    arr.fill(0)
    for(let i=0;i<width;i++){
        for(let j=0;j<height;j++){
            let idx = (i*height+j)*4;
            arr[idx] = _color.r;
            arr[idx+1] = _color.g;
            arr[idx+2] = _color.b;
            arr[idx+3] = _color.a;
            let k = 0;
        }
    }

    let img = new ImageAsset();
        img.reset({
            _data: arr,
            width: width,
            height: height,
            format: Texture2D.PixelFormat.RGBA8888,
            _compressed: false
        });
    
    tex.image = img;
    

    return tex;
}


let _texture:Texture2D = null;
export function createColorSpriteFrame(_rect:Rect=null){
    if(_texture==null){
        _texture = createTexture()
    } 
    _rect = _rect || rect(0,0,view.getVisibleSize().width,view.getVisibleSize().height);
    let spriteFrame = new SpriteFrame()
    spriteFrame.texture = _texture
    spriteFrame.rect = _rect
    
    return spriteFrame;
}