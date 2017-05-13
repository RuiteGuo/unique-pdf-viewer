


var PDFURL = 'test_example/gfs.pdf';                      // PDF 文档url
var SCALE = 1.5;                      // 渲染比例


PDFJS.workerSrc = '../lib/pdf.worker.js';



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
            for (var item of textContent.items) {
                var canvasWrapper = canvas.parentNode;
                canvasWrapper.height = canvas.height;
                canvasWrapper.width = canvas.width;

                var page = canvasWrapper.parentNode;
                page.height = canvas.height;
                page.width = canvas.width;

                var textLayer = canvasWrapper.nextSibling;
                textLayer.height = canvas.height;
                textLayer.width = canvas.width;

                var textItem = document.createElement('div');
                textLayer.appendChild(textItem);

                textItem.innerHTML = item.str;
                textItem.style.height = item.height;
                textItem.style.fontFamily = item.fontName;
                textItem.style.left = item.transform[4] + 'px';   // item.transform 结构同下面的transform解释
                textItem.style.top = item.transform[5] + 'px';        
            }
    }) ;
}



function pageRender(page) {                                 // page为PDFPageProxy对象
    
    var viewport = page.getViewport(SCALE);                      // viewport为PageViewport对象

    var canvas = document.getElementById('page' + page.pageNumber);
    var context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    pageTextRender(page, canvas);

    var renderContext = {
      canvasContext: context,
      viewport: viewport,
//      transform: [1,0,0,1,100,1000]                           // transform 第一个参数是水平长度比例，第四个是竖直长度比例，第二三个为旋转
                                                                // 第五个参数代表水平位置（对于左边框），第六个参数代表竖直位置（对于上边框），
                                                                // 返回的item里的竖直位置好像是对于下边框
    };
    var renderTask = page.render(renderContext);
    renderTask.then(function () {                               // renderTask属于 RenderTask 类
      console.log('Page rendered');
    });
}




var loadingTask = PDFJS.getDocument(PDFURL);                       // 主要工作流程代码
loadingTask.promise.then(function(pdf) {

    var NumberOfPages = pdf.numPages;                              // 获得pdf页数
    var viewer = document.getElementById('viewer');
 
    ViewerDomCreator(viewer, NumberOfPages);


    for(var pageNumber = 1; pageNumber <= NumberOfPages; pageNumber ++ ) {         // 依次渲染每一页

        pdf.getPage(pageNumber).then(function(page) {

            pageRender(page);            
        });               
    }

}, function (reason) {
        console.error(reason);
});


