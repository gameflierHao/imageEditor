var imageEditor = function(elem,img,resolution,callback,onDraw){
	elem.imageEditor = this;
	$(elem).addClass("imageEditorRoot");
	this.element = elem;
	this.element.status = "source";
	this.elementWidth = elem.offsetWidth;
	this.imageUrl = img;
	this.googleSearchComplete = googleSearchComplete;
	this.initPhotoUploadSearch();
	this.callback = callback;
	this.onDraw = (onDraw) ? onDraw : null;
	
	this.resolution = (resolution) ? resolution : 800;
	this.isSafari = (navigator.userAgent.indexOf("Safari") > -1 && navigator.userAgent.indexOf('Chrome') > -1) ? false : true;
	this.angle = 0;
	//this.zoom = 1;
	//this.xStart = 0;
	//this.yStart= 0;
	this.scale = 0;
	try {
		this.googleSearch = new google.search.ImageSearch();
		this.googleSearch.setResultSetSize(google.search.Search.LARGE_RESULTSET);
		this.googleSearch.setSearchCompleteCallback(parent, this.googleSearchComplete, [this.googleSearch]);			
		var appendPhoto = this.appendPhoto;
		var THIS = this;
		function googleSearchComplete (searcher, searchNum) {
			THIS.photoPage++;
			if(THIS.photoPage < 8){
				THIS.googleSearch.gotoPage(THIS.photoPage);
			}
			else{
				THIS.photoPage = 0;
			}
			var results = searcher.results;
			var res = [];
			for (var i = 0; i < results.length; i++) {		
				var result = results[i];
				var item ={};
				item.cover = result.tbUrl;
				item.url = result.url;
				res.push(item)
			}
			appendPhoto(res,THIS);
		}
	}
	catch(e){
		console.log(e);
	}			
	this.loadTemplate();
	this.initPhotoUploadItem();
}
imageEditor.prototype.loadTemplate =  function(){
	var element = this.element;
	var imageUrl = this.imageUrl;
	var showImage = this.showImage;
	this.loadHandle("imageEditorTemplate",null,function(data){	
		$(element).html(data).enhanceWithin();
		$(element).find(".imageUploadTemplate").css('display','block');
		$(element).find(".imageEditorTemplate").css('display','none');
		if(imageUrl != null){
			showImage(imageUrl,element);
		}
	})
}
imageEditor.prototype.initPhotoUploadSearch = function(){
	this.photoPage = 0;
	this.searchOption = this.searchOptionDefault;
}

imageEditor.prototype.initPhotoUploadItem = function(){
	var THIS = this;
	var element = this.element;
	var q = 0.5;
	$(element)
		.off("click")
		.off("change")
		.off("keypress")
		.on('click','.photoUploadItem',function(){
			THIS.setUploadItem(element,$(this).attr("alt"));
		})
		.on("change",".fileSelector",function(){
			var input = this;
			var img = document.createElement("img");
			if (input.files){
				var imageFile = input.files[0];
				var imageType = (imageFile && imageFile.type=="image/png") ? imageFile.type : "image/jpeg";
				if(imageFile){
					if(THIS.isSafari){
						var reader = new window.FileReader();
						reader.readAsDataURL(imageFile); 
						reader.onloadend = function() {
							var base64data = reader.result;         
							img.src = base64data;						
							img.onload = function(e) {
								var width = img.width;
								var height = img.height;
								if (width> THIS.resolution){
									width = THIS.resolution;
								}
								height = parseInt(width * img.height/img.width);
								
								var canvas = document.createElement("canvas");
								canvas.width = width;
								canvas.height = height;
								var ctx = canvas.getContext("2d");
								if(imageType=="image/png")
									ctx.drawImage( img, 0, 0, width, height);
								else
									imageEditor.prototype.drawImageIOSFix(ctx, img, 0, 0, img.width, img.height, 0, 0, width, height);
								THIS.showImage(canvas.toDataURL(imageType));
							}	
						}					
					}
					else{
						var windowURL = window.URL || window.webkitURL;
						img.src = windowURL.createObjectURL(imageFile);						
						img.onload = function(e) {
							THIS.showImage(img.src);
						}
					}
				}
				else{
					THIS.hideImage();
				}
			}
		})
		.on("change",".searchWebSource",function(){
			THIS.searchOption = this.value;
			$(element).find(".searchResult").empty();
			if(this.value!=null)
				goSearch(THIS.searchOption,THIS,$(element).find(".searchBox").val())
		})	
		.on("click",".addImage",function(){
			THIS.showImage($(this).attr("alt"));
			$(element).find(".searchArea").hide();
			THIS.clearImageFile();
		})
		.on("click",".cancel",function(){
			THIS.leaveEditor();
		})		
		.on("click",".editBtn",function(){
			var img = $(element).find(".showImage").attr("src");
			openEditor(img);
		})		
		.on("click",".moreAction",function(){
			var imageEditorScale = $(element).find(".imageEditorScale");
			imageEditorScale.toggle();
		})		
		.on("keypress",".searchBox",function(e){
			if(e.which == 13){
				e.preventDefault();
				var query = e.target.value;
				if(!query){
					alert("No search value!");
					return false;
				}
				$(element).find(".searchResult").empty();
				goSearch(THIS.searchOption,THIS,query);
			}
		});
	
	function goSearch(searchOption,THIS,query){
		switch(THIS.searchOption){
			case "flickr" :
				THIS.searchFlickrPhoto(THIS,query);
				break;
			case "google" :
				THIS.googleSearch.execute(query);
				break;	
			case "picasa"	:
				THIS.searchPicasaPhoto(THIS,query);
				break;
		}
	}
	
	function checkImage(img){
		try{
			var file = $(element).find(".fileSelector")[0].files[0];
			if(typeof file == "undefined"){
				 throw new ReferenceError('file undefined');
			}
			else{
				var reader = new window.FileReader();
				 reader.readAsDataURL(file); 
				 return true;
			}
		 }
		 catch(e){
			try{
				var image = $(element).find(".showImage")[0];
				var canvas = document.createElement("canvas");
				canvas.width = image.naturalWidth;
				canvas.height = image.naturalHeight;
				var ctx = canvas.getContext("2d");
				ctx.drawImage(image, 0, 0);
				var dataUrl =  canvas.toDataURL("image/jpeg");
				return dataUrl;
			}
			 catch(e){
				return false;
			}
		 }
	}
	function openEditor(img){
		element.status = "editor";
		var checkImageUrl = checkImage(img);
		var image = document.createElement('img');
		if(checkImageUrl === false){
			alert(TL("idx_18"));
			return false;
		}else if(checkImageUrl === true){
			image.src = img;
		}
		else{
			image.src = checkImageUrl;
		}
		image.onload = function(){
			 var scale = image.height/image.width;
			 $(element).find(".imageEditorControls .original").attr("val",scale);
			initEditor($(element).find(".imageEditorTemplate")[0],image.src,scale);
			$(element).find(".imageUploadTemplate").hide();
			$(element).find(".imageEditorTemplate").show();	
		}
		function initEditor(target,image,scale,callback){
			if(!image)
				return false;
			draw(image,scale,$(target).find(".theparent"));
			$(target).find(".slider" )
				.off('slidestart')
				.on('slidestart',function(){
					$(target).find(".coverFrame").css("display", "block")
					$(target).find(".guillotine-frame").css("display", "none");
					$(target).find(".coverFrame").css("width", THIS.elementWidth+"px");
					$(target).find(".coverFrame").css("height", THIS.elementWidth+"px");
					$(element).find(".theparent").css("max-width", (THIS.elementWidth)+"px")
				})
				.off('change')
				.on( 'change', function( event ) { 
					var val = ($(this).val()) ? $(this).val( ) : 0 ;
					var scale = 1;
					if(val>50){
						scale = (val/10)-5+1;
					}
					else{
						scale = 1/(-((val/10)-5-1));
					}
					if(scale>1){
						$(target).find(".coverFrame").css("max-width", (THIS.elementWidth/scale)+"px");
						$(target).find(".coverFrame").css("max-height", THIS.elementWidth+"px");
					}
					else{
						$(target).find(".coverFrame").css("max-width",THIS.elementWidth+"px");
						$(target).find(".coverFrame").css("max-height", (THIS.elementWidth*scale)+"px");
					}
				})
				.off('slidestop')
				.on( "slidestop", function(event, ui) {
					$(".coverFrame").css("display", "none");
					var val = ($(this).val()) ? $(this).val( ) : 0 ;
					var scale = 1;
					if(val>50){
						scale = (val/10)-5+1;
						draw(image,scale);
					}
					else{
						scale = 1/(-((val/10)-5-1));
						draw(image,scale);
					}				  
				});				
		}
		function draw(image,scale,target){		
			if(target && target.length>0){
				loadPicture(scale);
			}
			else{
				THIS.loadHandle("imageEditorImageTemplate",null,function(data){
					var div = $(element).find(".imageEditorArea");
					$(div).empty().append(data);
						loadPicture(scale);
				})
			}
			function loadPicture(scale){
				if(scale<1){
					var val =  Math.floor(100-((1/scale)+4)*10);
				}else{
					var val = Math.floor((scale+4)*10);
				}
				$(element).find(".slider" ).val(val).slider("refresh");
				var picture = $(element).find(".thepicture");
				picture.css("visibility","hidden");
				picture.attr("src",image);
				var imageEditor = $(element)[0].imageEditor;
				picture.off('load').on('load', function(){
					var width = this.naturalWidth;
					var height = scale * this.naturalWidth;
					if(scale>1){
						$(element).find(".theparent").css("max-width", (THIS.elementWidth/scale)+"px");
					}
					picture.guillotine({
						onChange: function(data, action){
							imageEditor.angle = data.angle;
							//imageEditor.zoom = data.scale;
							//imageEditor.startX = data.x;
							//imageEditor.startY = data.y;						
						},
						width:width,
						height:height,
						init:{ 
							angle : imageEditor.angle
							//,scale : imageEditor.zoom
							//,x : imageEditor.startX
							//,y : imageEditor.startY
						}
					});
					picture.guillotine('fit');
					picture.css("visibility","");
					$(element)
						.off("click",".rescaleBtn").on("click",".rescaleBtn",function(){
							var scale = parseFloat($(this).attr("val")); 
							if($(this).hasClass( "original" )){
								imageEditor.angle = 0;
								//imageEditor.zoom = 1;
								//imageEditor.startX = 0;
								//imageEditor.startY = 0;									
							}
							draw(image,scale);  
						})					
						.off("click",".rotateRight").on("click",".rotateRight",function(){
							picture.guillotine('rotateRight');
						})
						.off("click",".zoomIn").on("click",".zoomIn",function(){
							picture.guillotine('zoomIn');
						})
						.off("click",".zoomOut").on("click",".zoomOut",function(){
							picture.guillotine('zoomOut');
						})									
				});
			}
		}
	}
}		
imageEditor.prototype.showImage = function(img,elem){
	var element = (elem) ? elem : this.element;
	var showImageArea = $(element).find(".showImageArea");
	showImageArea.find(".editBtn").hide();
	showImageArea.find(".imageError").hide();
	showImageArea.find(".loadImage").show();
	var image = showImageArea.find(".showImage");
	image.hide();
	image.attr("src",img);
	image
		.off()
		.on( "load", function(){
			showImageArea.find(".editBtn").show();
			showImageArea.find(".loadImage").hide();
			image.show();
		} )
		.error(function() { 
			showImageArea.find(".imageError").show();
			showImageArea.find(".loadImage").hide();
			image.hide();
		});
}
imageEditor.prototype.hideImage = function(){
	var showImageArea = $(this.element).find(".showImageArea");
	showImageArea.find(".showImage").attr("src","");
	showImageArea.find(".editBtn").hide();
	showImageArea.hide();
}	
imageEditor.prototype.setUploadItem = function(element,type) {
	this.element = element;
	var searchArea = $(this.element).find(".searchArea"); 
	var inputTag = $(this.element).find(".fileSelector");
	switch(type){
		case "camera":
			if(localStorage.phonegap=="true"){
				imageEditor.prototype.getCameraFile(element);
				break;
			}
		case "files":
			if(localStorage.phonegap=="true"){
				imageEditor.prototype.getCameraFile(element,"file");
				break;
			}
			if(type=="camera"){
				inputTag.attr("accept","image/*");
				inputTag.attr("capture",""); 
			}
			else{
				inputTag.attr("accept","");
				inputTag.removeAttr("capture");
			}
			searchArea.hide();
			inputTag.focus();
			inputTag.trigger('click');
			break;	
		case "search":	
			searchArea.show();
			break;	
	}
}			
imageEditor.prototype.searchFlickrPhoto = function(THIS,text){
	var url = THIS.flickrSearchUrl(text); 
	var res = [];		
	THIS.getApi(url, null, function(data){
		var list = data.photos.photo;
		for (var i = 0; i < list.length; i++) {
			var result = list[i];
			var item ={};
			item.cover = "http://farm" +result.farm +".staticflickr.com/" +result.server +"/" +result.id +"_" +result.secret +"_q.jpg";
			item.url = "http://farm" +result.farm +".staticflickr.com/" +result.server +"/" +result.id +"_" +result.secret +"_b.jpg";
			res.push(item)
		}
		THIS.appendPhoto(res);
	});
}
imageEditor.prototype.searchPicasaPhoto = function(THIS,text){
	var url = THIS.picasaSearchUrl(text);
	var res = [];		
	THIS.getApi(url, null, function(data){
		var list = data.feed.entry;
		for (var i = 0; i < list.length; i++) {
			var result = list[i];
			var item ={};
			item.cover = result.media$group.media$thumbnail[1].url;
			item.url = result.content.src;
			res.push(item)
		}		
		THIS.appendPhoto(res);
	}, null, false);
}
imageEditor.prototype.clearImageFile = function(){
	var element = $(this.element).find(".fileSelector");
	element.clone().insertAfter(element);
	element.remove();
}
imageEditor.prototype.getStatus = function(element){
	if($(element).find(".imageEditorTemplate").css("display")=="block"){
		return true;
	}
	else{
		return false;
	}
}
imageEditor.prototype.getPhoto = function(quality){
	var onDraw = this.onDraw;
	var callbackOri =  this.callback;
	var callback = (onDraw) ? function(e){onDraw(true);callbackOri(e);} : callbackOri;
	var getStatus =this.getStatus;
	var reader = new window.FileReader();
	var imageFile = $(this.element).find(".fileSelector")[0].files[0];
	var imageFileType = (imageFile && imageFile.type=="image/png") ? imageFile.type : "image/jpeg";
	var resolution = this.resolution;
	var q= (quality) ? quality : 0.5;
	if(!$(this.element).find(".showImage").attr("src")){
		alert("No image");
		return false;
	}
	if(onDraw) onDraw(false);
	if(getStatus(this.element)){
		var target = $(this.element).find(".guillotine-window")[0];
		if(this.isSafari || (!imageFile)){
			html2canvas(target,{
				onrendered: function(canvas) {
					var newImg    = canvas.toDataURL(imageFileType,q);
					callback(newImg);
				}
			});	
		}
		else{
			reader.readAsDataURL(imageFile); 
			reader.onloadend = function() {
				var base64data = reader.result;         
				$(target).find(".thepicture").attr("src",base64data);
				html2canvas(target,{
					onrendered: function(canvas) {
						var newImg    = canvas.toDataURL(imageFileType,q);
						callback(newImg);
					}
				});
			}
		}
	}
	else{
		var img = document.createElement("img");
		img.src = $(this.element).find(".showImage")[0].src;
		img.onload = function(e) {
			try{
				if(typeof imageFile == "undefined"){
					 throw new ReferenceError('file undefined');
				}
				var width = img.width;
				var height = img.height;
				if (width> resolution){
					width = resolution;
				}
				height = parseInt(width * img.height/img.width);
				var canvas = document.createElement("canvas");
				canvas.width = width;
				canvas.height = height;
				var ctx = canvas.getContext("2d");
				if(imageFileType=="image/png")
					ctx.drawImage(img, 0, 0,width,height);
				else
					imageEditor.prototype.drawImageIOSFix(ctx, img, 0, 0, img.width, img.height, 0, 0, width, height);
				callback(canvas.toDataURL(imageFileType,q))
			}
			catch(e){
				callback(img.src);
			}
		}
	}
}
imageEditor.prototype.drawImageIOSFix = function(ctx, img, sx, sy, sw, sh, dx, dy, dw, dh) {
	var vertSquashRatio =  detectVerticalSquash(img);
	ctx.drawImage(img, sx * vertSquashRatio, sy * vertSquashRatio, sw * vertSquashRatio, sh * vertSquashRatio, dx, dy, dw, dh );
	function detectVerticalSquash(img) {
		var iw = img.naturalWidth, ih = img.naturalHeight;
		var canvas = document.createElement('canvas');
		canvas.width = 1;
		canvas.height = ih;
		var ctx = canvas.getContext('2d');
		ctx.drawImage(img, 0, 0);
		var data = ctx.getImageData(0, 0, 1, ih).data;
		var sy = 0;
		var ey = ih;
		var py = ih;
		while (py > sy) {
			var alpha = data[(py - 1) * 4 + 3];
			if (alpha === 0) {
				ey = py;
			} else {
				sy = py;
			}
			py = (ey + sy) >> 1;
		}
		var ratio = (py / ih);
		return (ratio===0)?1:ratio;
	}
}	
imageEditor.prototype.getApi = function(uri, data, callback, param, crossdomain){
	if(crossdomain != false){
		uri = uri + "&jsoncallback=?";
	}
	$.ajax({
		url: uri,
		dataType:'json',
		crossDomain: true,
		success: callback
	});
}
imageEditor.prototype.appendPhoto = function(photo,THIS){
	var element = THIS == null ? this.element : THIS.element;
	var loadHandle = THIS == null ?  this.loadHandle : THIS.loadHandle;
	var input = {};
	input.data = photo;
	loadHandle("imageItemTemplate",input,function(data){	
		$(element).find(".searchResult").append(data).enhanceWithin();
	})
}
imageEditor.prototype.flickrServices = "https://api.flickr.com/services/rest/?";
imageEditor.prototype.flickrAppKey = "94d8f23ee75ccff0bdab552e819b8991";
imageEditor.prototype.flickrFormat = "json";
imageEditor.prototype.flickrSearchUrl = function(text){
	var method = "flickr.photos.search";
	return this.flickrServices +"method=" +method +"&api_key=" +this.flickrAppKey +"&text=" +text +"&format=" +this.flickrFormat;
};
imageEditor.prototype.picasaSearchUrl = function(text){
	return "https://picasaweb.google.com/data/feed/api/all?q=" +text +"&max-results=60&alt=json";
};		
imageEditor.prototype.searchOptionDefault = "google";
imageEditor.prototype.loadHandle  = function(elementId,data,callback){
	var templateSource =  $("#"+elementId).html();
	var handleTemplate = Handlebars.compile(templateSource);
	callback(handleTemplate(data));
}

imageEditor.prototype.getCameraFile = function(element,type){
	navigator.camera.getPicture(onSuccess, onFail, 
		{ 	
			 quality: 20
			,destinationType: Camera.DestinationType.DATA_URL
			,sourceType : ((type=="file") ? Camera.PictureSourceType.PHOTOLIBRARY  : Camera.PictureSourceType.CAMERA)
			,allowEdit : true
			,encodingType: Camera.EncodingType.JPEG
		}
	);
	function onSuccess(imageData) {
		imageEditor.prototype.showImage( "data:image/jpeg;base64," + imageData,element);
		imageEditor.prototype.removeCameraFile();
	}
	function onFail(message) {
		console.log('Failed because: ' + message);
		imageEditor.prototype.removeCameraFile();
	}
}

imageEditor.prototype.removeCameraFile = function(){
	navigator.camera.cleanup(onSuccess, onFail);
	function onSuccess() {
		console.log("Camera cleanup success.")
	}
	function onFail(message) {
		console.log('Failed because: ' + message);
	}
}

imageEditor.prototype.leaveEditor = function(){
	var element = this.element;
	if(element.status=="source"){
		return false;
	}
	else if(element.status=="editor"){
		var confirmMessage= confirm(TL("idx_17"))
		if(confirmMessage == true){
			$(element).find(".imageUploadTemplate").css('display','block');
			$(element).find(".imageEditorTemplate").css('display','none');
			$(element).find(".theparent").remove();
			$(element)[0].imageEditor.angle = 0;
			//$(element)[0].imageEditor.zoom = 1;
			//$(element)[0].imageEditor.startX = 0;
			//$(element)[0].imageEditor.startY = 0;
			element.status = "source";
		}
		return true;
	}
}