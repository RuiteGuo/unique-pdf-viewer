
var winHeight;
if (window.innerHeight)
    winHeight = window.innerHeight;
else if ((document.body) && (document.body.clientHeight))
    winHeight = document.body.clientHeight;
var PDFURL = 'test_example/gfs.pdf';                      // PDF 文档url
var SCALE = 1;                      // 渲染比例
var renderContext = [];
var config = {
    scale: SCALE,
    pdfurl: PDFURL
};
var tempOffset = 0, offset;
let pageArray = [];
let canvasArray = [];

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
      
      var textLayer = document.createElement('div');
      page.appendChild(textLayer);
      textLayer.className = "textLayer";

      var canvas = document.createElement('canvas');
      canvasWrapper.appendChild(canvas);
      canvas.id = "page" + i;
  }
}



function pageTextRender(page, canvas) {                          // 文本渲染成div元素，page为PDFPageProxy对象
    
    var textContent = null; 
    page.getTextContent().then(function(context){               // 获得文本信息，context为TextContent对象
            textContent = context;
            console.log(textContent);
            for (var item of textContent.items) {
                var canvasWrapper = canvas.parentNode;
                canvasWrapper.style.height = canvas.style.height;
                canvasWrapper.style.width = canvas.style.width;

                var page = canvasWrapper.parentNode;
                page.style.height = canvas.style.height;
                page.style.width = canvas.style.width;

                var textLayer = canvasWrapper.nextSibling;
                textLayer.style.height = canvas.style.height;
                textLayer.style.width = canvas.style.width;

                var textItem = document.createElement('div');
                textLayer.appendChild(textItem);

                textItem.innerHTML = item.str;
                textItem.style.fontSize = item.transform[0] * SCALE + 'px';
                textItem.style.fontFamily = 'sans-serif';
                textItem.style.width = item.width * SCALE+ 'px';
                textItem.style.left = item.transform[4] * SCALE+ 'px';   // item.transform 结构同下面的transform解释
                textItem.style.top = (canvas.height/SCALE - item.transform[5] - item.transform[0] + 3) * SCALE + 'px';
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
    renderTask.then(function () {                               // renderTask属于 RenderTask 类
      console.log('Page rendered');
    });
}


chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {

    alert("1");
    console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");
  });



chrome.runtime.sendMessage({greeting: "hello"}, function(response) {

  for ( var item in response) {
      if (item === "URL") {
        PDFURL = response.URL;
        init();
      }
  }
});

function init() {
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
                    for (let i = 0; i < pageArray.length; i++) {
                        renderContext[i].viewport = pageArray[i].getViewport(config.scale);
                        canvasArray[i].height = renderContext[i].viewport.height;
                        canvasArray[i].width = renderContext[i].viewport.width;
                        renderContext[i].canvasContext = canvasArray[i].getContext('2d');
                        pageArray[i].render(renderContext[i]);
                    // console.log("*****************");
                    }
                }
            },
            get: function () {
                return SCALE;
            }
        })
    });
}
//
// function renderWrapper(i){
//     let xun = render(i);
//     xun.promise.then(function () {
//         i++;
//         if(i<pageArray.length)
//             renderWrapper(i);
//     })
// }
// function render(i){
//     renderContext[i].viewport = pageArray[i].getViewport(config.scale);
//     canvasArray[i].height = renderContext[i].viewport.height;
//     canvasArray[i].width = renderContext[i].viewport.width;
//     renderContext[i].canvasContext = canvasArray[i].getContext('2d');
//     pageArray[i].render(renderContext[i]);
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
        // if(offset > 50){
        //     config.scale = 1 - Math.abs(offset/winHeight*2);
        //     //console.log(config.scale);
        // }
        // else if(offset < -50){
        //     config.scale = 1 - Math.abs(offset/winHeight*2);
        //     //console.log(config.scale);
        // }
        // else {
        //     config.scale = 1;
        // }
        if(Math.abs(offset)<=50&&Math.abs(offset-tempOffset)>10){
            config.scale = 1;
        }
        else if(Math.abs(offset)>50&&Math.abs(offset)<=300&&Math.abs(offset-tempOffset)>10){
            // config.scale = 1 - (Math.abs(offset)-50)/(300-50)*0.3;
            config.scale = 0.7;
        }
        else if(Math.abs(offset)>300&&Math.abs(offset-tempOffset)>1){
            // config.scale = 0.7 - (Math.abs(offset)-300)/(winHeight/2-300)*0.2;
            config.scale = 0.5;
        }
        //console.log(pointer_y)
        tempOffset = offset;
    }
};

