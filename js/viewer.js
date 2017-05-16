/**
 * Created by lzk on 5/14/17.
 */

var winHeight;
if (window.innerHeight)
    winHeight = window.innerHeight;
else if ((document.body) && (document.body.clientHeight))
    winHeight = document.body.clientHeight;
var PDFURL = 'test_example/gfs.pdf';                      // PDF 文档url
var SCALE = 1.5;                      // 渲染比例
var renderContext = [];
var config = {
    scale: SCALE,
    pdfurl: PDFURL
};
var tempOffset = 0, offset;
let pageArray = [];
let canvasArray = [];
var importantInfo = [];
let infoImageArray = [];
var imageArray = [];
var infoArray = [];
var textArray = [];
var speed = 20;
var t;

PDFJS.workerSrc = 'lib/pdf.worker.js';


function ViewerDomCreator(viewer, numberofpages){                                // 创建viewer DOM元素里的DOM结构
    // viewer为DOM元素
    for(var i = 1; i <= numberofpages; i ++) {
        var page = document.createElement('div');
        viewer.appendChild(page);
        page.className = "page";

        var canvasWrapper = document.createElement('div');
        page.appendChild(canvasWrapper);
        canvasWrapper.className = "canvasWrapper";



        var canvas = document.createElement('canvas');
        canvasWrapper.appendChild(canvas);
        canvas.id = "page" + i;

        var textLayer = document.createElement('div');
        page.appendChild(textLayer);
        textLayer.className = "textLayer";
        textArray.push(textLayer);
    }
}



function pageTextRender(page, canvas) {                          // 文本渲染成div元素，page为PDFPageProxy对象

    var textContent = null;
    page.getTextContent().then(function(context){               // 获得文本信息，context为TextContent对象
        textContent = context;
        console.log(textContent);
        var canvasWrapper = canvas.parentNode;
        canvasWrapper.style.height = canvas.height;
        canvasWrapper.style.width = canvas.width;

        canvasWrapper.nextSibling.style.left = (window.innerWidth/2 - canvas.width/2 - 5) + 'px' ;
        imageArray.push(canvasWrapper);

        var page = canvasWrapper.parentNode;
        page.style.height = canvas.height;
        page.style.width = canvas.width;
        console.log(canvas.width);

        var imageWrapper = document.createElement('div');
        imageWrapper.style.left = (window.innerWidth/2 - canvas.width/2 - 5) + 'px' ;
        imageWrapper.className = 'imageWrapper';
        infoArray.push(imageWrapper);
        page.appendChild(imageWrapper);
        for (var item of textContent.items) {


            if(item.transform[0]>10) {
                var infoObj = {
                    page: canvas.id.split('e')[1],
                    fontSize: item.transform[0] * SCALE + 'px',
                    width: item.width * SCALE + 'px',
                    left: item.transform[4] * SCALE + 'px',
                    top: (canvas.height/SCALE - item.transform[5] - item.transform[0] - 7) * SCALE + 'px'
                };
                importantInfo.push(infoObj);
            }

            var textLayer = canvasWrapper.nextSibling;
            textLayer.style.height = canvas.height;
            textLayer.style.width = canvas.width;

            var textItem = document.createElement('div');
            textLayer.appendChild(textItem);

            textItem.innerHTML = item.str;
            textItem.style.fontSize = item.transform[0] * SCALE + 'px';
            textItem.style.fontFamily = 'sans-serif';
            textItem.style.width = item.width * SCALE+ 'px';
            textItem.style.left = item.transform[4] * SCALE+ 'px';   // item.transform 结构同下面的transform解释
            textItem.style.top = (canvas.height/SCALE - item.transform[5] - item.transform[0] - 7) * SCALE + 'px';
        }
    }) ;
}



function pageRender(page) {                                 // page为PDFPageProxy对象

    var viewport = page.getViewport(SCALE);                      // viewport为PageViewport对象

    var canvas = document.getElementById('page' + page.pageNumber);
    var context = canvas.getContext('2d');
    canvasArray.push(canvas);
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    pageTextRender(page, canvas);
    let tempRenderContext = {
        canvasContext: context,
        viewport: viewport
    };
    renderContext.push (tempRenderContext
//      transform: [1,0,0,1,100,1000]                           // transform 第一个参数是水平长度比例，第四个是竖直长度比例，第二三个为旋转
        // 第五个参数代表水平位置（对于左边框），第六个参数代表竖直位置（对于上边框），
        // 返回的item里的竖直位置好像是对于下边框
    );
    //console.log(tempRenderContext);
    var renderTask = page.render(tempRenderContext);

    canvas.style.display = 'none';
    renderTask.then(function () {
        // var canvas = document.getElementById('page' + pageNumber);

        var image = canvas.toDataURL('image/jpeg', 1);
        var imageContainer = document.createElement('img');
        imageContainer.style.marginTop = "-10px";
        imageContainer.src = image;
        canvas.parentNode.appendChild(imageContainer);
        for(var item of importantInfo){
            //console.log(item.page + " " + page.pageNumber);
            if(item.page == page.pageNumber){
                var info = document.createElement('img');
                info.style.left = 0;
                info.style.top = '-10px';
                info.style.position = 'absolute';
                // info.style.background = "transparent url("+image+") " + item.left + " " + item.top+" ";
                info.src = image;
                // console.log("rect(" + (parseFloat(item.top.split('p')[0]) + 8) + "px "
                //     + (parseFloat(item.left.split('p')[0])+parseFloat(item.width.split('p')[0]) + 2) + "px "
                //     + (parseFloat(item.top.split('p')[0]) + parseFloat(item.fontSize.split('p')[0])) + "px "
                //     + (parseFloat(item.left.split('p')[0]) - 2) + "px" + " )");
                info.style.clip = "rect(" + (parseFloat(item.top.split('p')[0]) + 6) + "px "
                    + (parseFloat(item.left.split('p')[0])+parseFloat(item.width.split('p')[0])+6) + "px "
                    + (parseFloat(item.top.split('p')[0]) + parseFloat(item.fontSize.split('p')[0]) + 12) + "px "
                    + (parseFloat(item.left.split('p')[0]) - 26) + "px" + " )";

                canvas.parentNode.nextSibling.nextSibling.appendChild(info);
            }
        }
        // renderTask属于 RenderTask 类
        console.log('Page rendered');
    });
}


// chrome.runtime.onMessage.addListener(
//     function(request, sender, sendResponse) {
//
//         alert("1");
//         console.log(sender.tab ?
//         "from a content script:" + sender.tab.url :
//             "from the extension");
//     });
//
//
//
// chrome.runtime.sendMessage({greeting: "hello"}, function(response) {
//
//     for ( var item in response) {
//         if (item === "URL") {
//             PDFURL = response.URL;
//             init();
//         }
//     }
// });

// function init() {
    var loadingTask = PDFJS.getDocument(PDFURL);                       // 主要工作流程代码

    loadingTask.promise.then(function(pdf) {

        var NumberOfPages = pdf.numPages;                              // 获得pdf页数
        var viewer = document.getElementById('viewer');

        ViewerDomCreator(viewer, NumberOfPages);


        for(var pageNumber = 1; pageNumber <= NumberOfPages; pageNumber ++ ) {         // 依次渲染每一页

            pdf.getPage(pageNumber).then(function(page) {
                pageArray.push(page);
                pageRender(page);
            });
        }

    }, function (reason) {
        console.error(reason);
    }).then(function () {

        Object.defineProperty(config, 'scale', {
            set: function (value) {
                if (SCALE != value) {
                    SCALE = value;
                    // for(let i = 0;i<imageArray.length;i++){
                    //     console.log(i);
                    //     imageArray[i].style.zIndex = (10-i) + "";
                    // }
                    for(var item of imageArray){
                        item.style.transform = "scale("+SCALE+ "," + SCALE + ")";
                        item.style.height = 816*SCALE + 'px';
                    }
                    for(var item1 of infoArray){
                            item1.style.transform = "scale(" + SCALE + "," + SCALE + ")";
                            canvas = document.getElementById("page1");
                            item1.style.left = (window.innerWidth / 2 - canvas.width / 2 - 5 * SCALE) + 'px';
                            // item1.style.left = 0;
                    }
                    for(var item2 of textArray){
                        item2.style.display = 'none';
                    }
                }
            },
            get: function () {
                return SCALE;
            }
        });
    });
// }


//get mouse position
var getCoordInDocument = function(e) {
    e = e || window.event;
    // var x = e.pageX || (e.clientX +
    //     (document.documentElement.scrollLeft
    //     || document.body.scrollLeft));
    var y= e.pageY || (e.clientY +
        (document.documentElement.scrollTop
        || document.body.scrollTop));
    return y;
};

window.onload = function () {
    var coords = document.getElementById("outerContainer");
    coords.onmousemove = function(e) {
        var pointer_y = getCoordInDocument(e);

        offset = winHeight/2 - pointer_y;
        var current_pos;
        if(offset > 50){
            current_pos = document.getElementById('viewerContainer').scrollTop;
            console.log(current_pos);
            // window.scrollTo(0, current_pos + 300);
            document.getElementById('viewerContainer').scrollTop =  current_pos - 10;
        }
        else if(offset < -50){
            current_pos = document.getElementById('viewerContainer').scrollTop;
            console.log(current_pos);
            document.getElementById('viewerContainer').scrollTop =  current_pos + 10;
        }


        if(Math.abs(offset)<=50&&Math.abs(offset-tempOffset)>1){
            config.scale = 1;
        }
        else if(Math.abs(offset)>50&&Math.abs(offset)<=300&&Math.abs(offset-tempOffset)>1){
            config.scale = 1 - (Math.abs(offset)-50)/(300-50)*0.3;
            // config.scale = 0.7;
        }
        else if(Math.abs(offset)>300&&Math.abs(offset-tempOffset)>1){
            config.scale = 0.7 - (Math.abs(offset)-300)/(winHeight/2-300)*0.2;
            // config.scale = 0.5;
        }
        //console.log(pointer_y);
        tempOffset = offset;
    };
};
// init();
function scroll(){

}
