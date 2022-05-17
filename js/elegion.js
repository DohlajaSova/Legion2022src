function docReady(fn) {
	if (document.readyState === "complete" || document.readyState === "interactive") {
		setTimeout(fn, 1);
	} else {
		document.addEventListener("DOMContentLoaded", fn);
	}
}

function findOffset(element) {
    let top = 0, left = 0;

    do {
        top += element.offsetTop  || 0;
        left += element.offsetLeft || 0;
        element = element.offsetParent;
    } while(element);

    return {
        top: top,
        left: left
    };
}

function objToQuery(obj) {
  // Convert flat map to query string.
  let str = [];
  for (let p in obj) {
    if (obj.hasOwnProperty(p)) {
      str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
    }
  }
  return str.join("&");
}

function closeAllSelect(elmnt) {
  /* A function that will close all select boxes in the document,
  except the current select box: */
  let selectItems, selectSelected, i, xl, yl, arrNo = [];
  selectItems = document.getElementsByClassName("select-items");
  selectSelected = document.getElementsByClassName("select-selected");
  xl = selectItems.length;
  yl = selectSelected.length;
  for (i = 0; i < yl; i++) {
    if (elmnt == selectSelected[i]) {
      arrNo.push(i)
    } else {
        selectSelected[i].classList.remove("select-arrow-active");
    }
  }
  for (i = 0; i < xl; i++) {
    if (arrNo.indexOf(i)) {
        selectItems[i].classList.add("select-hide");
    }
  }
}

function ContactMap(container, switcherItems, selectControl)
{
  function init() {
    let map = new google.maps.Map(container);
    initMap(map);
    initSwitcher(map);
    putMarkers(map);
    drawRoutes(map);
  }

  function initMap(map) {
    let opts = {
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      disableDefaultUI: true,
      panControl: true,
      panControlOptions: {
        position: google.maps.ControlPosition.LEFT_CENTER
      },
      zoomControl: true,
      zoomControlOptions: {
        style: google.maps.ZoomControlStyle.SMALL,
        position: google.maps.ControlPosition.LEFT_CENTER
      },
      mapTypeControl: false,
      scaleControl: false,
      streetViewControl: true,
      overviewMapControl: true,
      overviewMapControlOptions: {
        opened: true
      }
    };
    map.setOptions(opts);
  }

  function toggleActiveTab(target) {
    let clickedIndex = 0;
    if (target.parentNode){
        clickedIndex = Array.from(Array.prototype.slice.call(selectControl.children)[2].children).indexOf(target);
        let cityTabs = Array.prototype.slice.call(Array.prototype.slice.call(selectControl.children)[2].children);
        for (let item of cityTabs) {
          item.classList.remove('same-as-selected');
        }
        cityTabs[clickedIndex].classList.add('same-as-selected');
    }
    return clickedIndex;
  }

  function toggleActiveText(index) {
    for (let item of switcherItems) {
      item.classList.remove('active');
    }
    switcherItems[index].classList.add('active');
  }

  function centerMap(map, lat, lng, zoom) {
    let center = new google.maps.LatLng(lat, lng);
    map.panTo(center);
    map.setZoom(parseInt(zoom));
  }

  function initSwitcher(map) {
    let onClick = function() {
      let clickedIndex = toggleActiveTab(this);
      let data = switcherItems[clickedIndex].dataset;// номер кликнутого
      toggleActiveText(clickedIndex);
      let lat = data.centerLat || data.markerLat;
      let lng = data.centerLng || data.markerLng;
      centerMap(map, lat, lng, data.zoom);
    };
    for (let item of Array.prototype.slice.call(selectControl.children)[2].children) {
      item.addEventListener('click', onClick);
    }
    onClick.apply(selectControl[0]);
  }

  function putMarkers(map) {
    let icon = {
      url: container.dataset.markerImage,
      size: new google.maps.Size(48, 48),
      origin: new google.maps.Point(0, 0),
      anchor: new google.maps.Point(24, 48)
    };
    for (let item of switcherItems) {
      let data = item.dataset;
      let position = new google.maps.LatLng(data.markerLat, data.markerLng);
      new google.maps.Marker({ map, position, icon });
    }
  }

  function drawRoutes(map) {
    for (let item of switcherItems) {
      let data = item.dataset;
      if (!data.routePoints) {
        continue;
      }
      let points = data.routePoints.split('; ').map((x) => x.split(',').map(parseFloat));
      let path = points.map((pt) => new google.maps.LatLng(pt[0], pt[1]));
      new google.maps.Polyline({
        map: map,
        path: path,
        geodesic: true,
        strokeColor: 'rgb(35, 168, 224)',
        strokeOpacity: 1.0,
        strokeWeight: 3
      });
    }
  }

  function load() {
    window.map_initialized = function() { init(); };
    let getUrl = function() {
      let base = 'https://maps.googleapis.com/maps/api/js';
      let options = {
        key: container.dataset.apiKey,
        language: container.dataset.language,
        callback: 'map_initialized'
      };
      let args = objToQuery(options);
      return [base, args].join('?');
    };
    let script = document.createElement("script");
    script.src = getUrl();
    document.body.appendChild(script);
  }

  if (container) {
    load();
  }
}

function TextareaOnInput() {
  this.style.height = "auto";
  this.style.height = (this.scrollHeight) + "px";
}

function portfolioRefresh(limit){
    let portfolioBlocks = document.querySelectorAll(".js-cases-container-portfolio .container_portfolio-inner")[0];
    let moreButton = document.querySelectorAll(".js-cases-more")[0];
    let shown = 0;
    for (let i=0; i<portfolioBlocks.children.length; i++){
        portfolioBlocks.children[i].classList.add("not-shown");
    }
    for (let i=0; i<portfolioBlocks.children.length; i++){
        if (!portfolioBlocks.children[i].classList.contains("hide")){
            shown++;
            if (shown <= limit)
                portfolioBlocks.children[i].classList.remove("not-shown");
        }
    }
    if (shown <= limit)
        moreButton.parentNode.classList.add("hide");
}

function vacanciesRefresh(limit){
    let vacanciesBlocks = document.querySelectorAll(".js-vacancies-container .vacancies__container_inner")[0];
    let moreButton = document.querySelectorAll(".js-vacancies-more")[0];
    let shown = 0;
    for (let i=0; i<vacanciesBlocks.children.length; i++){
        vacanciesBlocks.children[i].classList.add("not-shown");
    }
    for (let i=0; i<vacanciesBlocks.children.length; i++){
        if (!vacanciesBlocks.children[i].classList.contains("hide")){
            shown++;
            if (shown <= limit)
                vacanciesBlocks.children[i].classList.remove("not-shown");
        }
    }
    if (shown <= limit)
        moreButton.parentNode.classList.add("hide");
	else
        moreButton.parentNode.classList.remove("hide");
}

docReady(function() {
    // фиксим хедер при скролле
    let stickyHeader = document.getElementsByClassName('header')[0];
    //let headerOffset = findOffset(stickyHeader);
    let lastScrollTop = 0;
    let windowWidth  = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    let i,j;
    let backButton = document.querySelector(".js-top");

    if (windowWidth <= 550)
    {
        let bodyScrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        window.onscroll = function() {
            if (bodyScrollTop > 50){
                stickyHeader.classList.add('header_scrolled');
            } else {
                stickyHeader.classList.remove('header_scrolled');
            }

            if (bodyScrollTop > lastScrollTop || bodyScrollTop < 50){
                stickyHeader.classList.remove('header_sticky');
            } else {
                stickyHeader.classList.add('header_sticky');
            }
            lastScrollTop = bodyScrollTop <= 0 ? 0 : bodyScrollTop;
        };
    }

    window.onscroll = function() {
        let bodyScrollTop = document.documentElement.scrollTop || document.body.scrollTop;

        if (bodyScrollTop < 500) backButton.classList.add("hide");
        else backButton.classList.remove("hide");
    }

    
    // слайдер с проектом
    let sliderDots = document.querySelectorAll(".js-cases-dots");
    for (i=0; i<sliderDots.length; i++){
        sliderDots[i].addEventListener("click", function(e){
            e.preventDefault();
            let slider = this.previousElementSibling; // контейнер со слайдами
            let sliderControlsContainer = this; // кликнутая точка
            if (e.target.tagName == "A")
            {
                let sliderControls = Array.prototype.slice.call(e.target.parentNode.parentNode.children); // контейнер с точками
                let clickedItemNumber = sliderControls.indexOf(e.target.parentNode); // номер кликнутого элемента
                for (i=0; i<slider.children.length; i++){
                    slider.children[i].classList.remove("active");
                    sliderControls[i].classList.remove("active");
                }
                slider.children[clickedItemNumber].classList.add("active");
                sliderControls[clickedItemNumber].classList.add("active");
            }
        }, false);
    }
    
    // слайдер с информацией
    let sliderInfoDots = document.querySelectorAll(".js-cases-info-dots");
    for (i=0; i<sliderInfoDots.length; i++){
        sliderInfoDots[i].addEventListener("click", function(e){
            e.preventDefault();
            let slider = this.parentNode.previousElementSibling; // контейнер со слайдами
            let sliderControlsContainer = this; // кликнутая точка
            if (e.target.tagName == "A")
            {
                let sliderControls = Array.prototype.slice.call(e.target.parentNode.parentNode.children); // контейнер с точками
                let clickedItemNumber = sliderControls.indexOf(e.target.parentNode); // номер кликнутого элемента
                for (i=0; i<slider.children[0].children.length; i++){
                    slider.children[0].children[i].classList.remove("active");
                    sliderControls[i].classList.remove("active");
                }
                slider.children[0].children[clickedItemNumber].classList.add("active");
                sliderControls[clickedItemNumber].classList.add("active");
            }
        }, false);
    }
    
    // слайдер с принципами
    //let sliderProblemsDots = document.querySelectorAll(".js-problems-groups-dots");
    //for (i=0; i<sliderProblemsDots.length; i++){
        /*sliderProblemsDots[i].addEventListener("click", function(e){
            e.preventDefault();
            let slider = this.parentNode.previousElementSibling; // контейнер со слайдами
            let sliderControlsContainer = this; // кликнутая точка
            if (e.target.tagName == "A")
            {
                let sliderControls = Array.prototype.slice.call(e.target.parentNode.parentNode.children); // контейнер с точками
                let clickedItemNumber = sliderControls.indexOf(e.target.parentNode); // номер кликнутого элемента
                for (i=0; i<slider.children[0].children[0].children.length; i++){
                    slider.children[0].children[0].children[i].classList.remove("active");
                    sliderControls[i].classList.remove("active");
                }
                slider.children[0].children[0].children[clickedItemNumber].classList.add("active");
                sliderControls[clickedItemNumber].classList.add("active");
            }
        }, false);*/
    //}
    let sliderProblems = document.querySelectorAll(".js-problems-slider-groups");
    let sliderProblemsDots = document.querySelectorAll(".js-problems-groups-dots");
    let sliderProblemsSlider = new Array();
    if (sliderProblems.length > 0)
    {
        for (i=0; i<sliderProblems.length; i++){
            sliderProblemsSlider[i] = tns({
                container: sliderProblems[i],
                items: 1,
                controls: false,
                navPosition: 'bottom',
                navContainer: sliderProblemsDots[i],
                mouseDrag: true,
                slideBy: 'page'
            });
        }
    }

    // слайдер со статьями
    if (document.querySelectorAll(".js-project-article").length > 0)
    {
        let sliderProjects = tns({
            container: '.js-project-article',
            items: 1,
            controls: false,
            navPosition: 'bottom',
            navContainer: '.js-project-article-dots',
            mouseDrag: true,
            slideBy: 'page'
        });
    }
    
    // блок с кейсами
    if (document.querySelectorAll(".js-cases-container").length > 0)
    {
        let container = document.querySelector(".js-cases-container");
        let cases = Array.prototype.slice.call(container.children);

        let block = new Array();
        let curBlock = 0;
        let count = 1;
        let limit = 4;
        
        let sliderContainer = document.createElement("div");
        sliderContainer.className = "cases-container__inner js-cases-container-inner";
        container.appendChild(sliderContainer);
        
        for (i=0; i<cases.length; i++){
            if (cases[i].classList.contains("cases__case"))
            {
                if (count == 1){
                    curBlock++;
                    block[curBlock] = document.createElement("div");
                    block[curBlock].className = "cases__block";
                    sliderContainer.appendChild(block[curBlock]);
                }
                if (cases[i].classList.contains("cases__case_double") && (count <= limit-1))
                {
                    block[curBlock].insertAdjacentElement('beforeEnd', cases[i]);
                    count++;
                }
                else if ((!cases[i].classList.contains("cases__case_double")) && (count <= limit))
                {
                    block[curBlock].insertAdjacentElement('beforeEnd', cases[i]);
                }
                count++;
                if (count > limit)
                    count = 1;
            }
        }
        if (windowWidth <= 650){
            let sliderCases = tns({
                container: '.js-cases-container-inner',
                items: 1,
                gutter: 15,
                axis: "horizontal",
                controls: false,
                navPosition: 'bottom',
                mouseDrag: true,
                slideBy: 'page'
            });
        }
        else{
            let sliderCases = tns({
                container: '.js-cases-container-inner',
                items: 2,
                gutter: 15,
                axis: "vertical",
                controls: false,
                navPosition: 'bottom',
                mouseDrag: true,
                slideBy: 'page'
            });
        }
    }
    
    // фильтр на странице портфолио
    let portfolioBlocks = document.querySelectorAll(".js-cases-container-portfolio .container_portfolio-inner");
    let portfolioTypes = document.querySelectorAll(".js-cases-types");
    let portfolioTags = document.querySelectorAll(".js-cases-tags");

    if (portfolioBlocks.length >0)
    {
        let curLimit = document.querySelectorAll(".js-cases-container-portfolio")[0].dataset.limit*1;
        let moreButton = document.querySelectorAll(".js-cases-more")[0];
        moreButton.addEventListener("click", function(e){
            e.preventDefault();
            curLimit += 4;
            portfolioRefresh(curLimit);
        })
        portfolioRefresh(curLimit);

        for (i=0; i<portfolioTypes.length; i++){
            let types = new Array();
            for (j=0; j<portfolioBlocks[0].children.length; j++){
                let typeString = portfolioBlocks[0].children[j].dataset.types.slice(1,portfolioBlocks[0].children[j].dataset.types.length-1);
                types[j] = typeString.split(",");
            }

            portfolioTypes[i].addEventListener("click", function(e){
                let options = e.target.parentNode.parentNode.childNodes[0];
                e.preventDefault();
                let selectedType = options.selectedOptions[0].value;
                for (j=0; j<types.length; j++){
                    if (!types[j].includes("'" + selectedType + "'")){
                        portfolioBlocks[0].children[j].classList.add("hide");
                    }
                    else{
                        portfolioBlocks[0].children[j].classList.remove("hide");
                    }
                }
                portfolioRefresh(curLimit);
            })
        }
        for (i=0; i<portfolioTags.length; i++){
            let tags = new Array();
            for (j=0; j<portfolioBlocks[0].children.length; j++){
                let tagString = portfolioBlocks[0].children[j].dataset.tags.slice(1,portfolioBlocks[0].children[j].dataset.tags.length-1);
                tags[j] = tagString.split(",");
            }

            portfolioTags[i].addEventListener("click", function(e){
                e.preventDefault();
				let selectedTag;
				if (e.target.getAttribute("href") != null){
					selectedTag = e.target.getAttribute("href").slice(1);
					for (j=0; j<portfolioTags[0].children.length; j++){
						portfolioTags[0].children[j].classList.remove("active");
					}
					e.target.classList.add("active");
					for (j=0; j<tags.length; j++){
						if (!tags[j].includes("'" + selectedTag + "'")){
							portfolioBlocks[0].children[j].classList.add("hide");
						}
						else{
							portfolioBlocks[0].children[j].classList.remove("hide");
						}
					}
					portfolioRefresh(curLimit);
				}
            })
        }
    }
	
    // фильтр на странице вакансий
    let vacanciesBlocks = document.querySelectorAll(".js-vacancies-container .vacancies__container_inner");
    let vacanciesTypes = document.querySelectorAll(".js-vacancies-types");

    if (vacanciesBlocks.length >0)
    {
        let curLimit = document.querySelectorAll(".js-vacancies-container")[0].dataset.limit*1;
        let moreButton = document.querySelectorAll(".js-vacancies-more")[0];
        moreButton.addEventListener("click", function(e){
            e.preventDefault();
            curLimit += 4;
            vacanciesRefresh(curLimit);
        })
        vacanciesRefresh(curLimit);

        for (i=0; i<vacanciesTypes.length; i++){
            let types = new Array();
            for (j=0; j<vacanciesBlocks[0].children.length; j++){
                let typeString = vacanciesBlocks[0].children[j].dataset.types.slice(1,vacanciesBlocks[0].children[j].dataset.types.length-1);
                types[j] = typeString.split(",");
            }

            vacanciesTypes[i].addEventListener("click", function(e){
                let options = e.target.parentNode.parentNode.childNodes[0];
                e.preventDefault();
                let selectedType = options.selectedOptions[0].value;

                for (j=0; j<types.length; j++){
                    if (!types[j].includes("'" + selectedType + "'")){
                        vacanciesBlocks[0].children[j].classList.add("hide");
                    }
                    else{
                        vacanciesBlocks[0].children[j].classList.remove("hide");
                    }
                }
                vacanciesRefresh(curLimit);
            })
        }
    }
	

    // блок вакансий
    let vacancyBlocks = document.querySelectorAll(".vacancy");
    if (vacancyBlocks.length) {
        for (i=0; i<vacancyBlocks.length; i++){
            vacancyBlocks[i].addEventListener("mouseover", function(e){
                e.preventDefault();
                let vacancyContainer = this.children[0]; // контейнер с вакансией
                let vacancyContainerHeight = vacancyContainer.getBoundingClientRect().height;
                let vacancyName = vacancyContainer.getElementsByClassName("vacancy__title_name")[0];
                let vacanceNameHeight = vacancyName.getBoundingClientRect().height+100;
                let vacancyTitle = vacancyName.parentNode;
                let vacancyBody = vacancyTitle.nextElementSibling;
				let sendAdjust = 0;
				if (this.classList.contains("vacancy_send"))
					sendAdjust = 120;
                vacancyTitle.style.top = -sendAdjust + vacanceNameHeight - vacancyContainerHeight + "px";
                vacancyBody.style.top = -sendAdjust + vacanceNameHeight - vacancyContainerHeight + "px";
                vacancyBody.style.height = sendAdjust + vacancyContainerHeight - vacanceNameHeight + 92 + "px";
            }, false);
            vacancyBlocks[i].addEventListener("mouseout", function(e){
                e.preventDefault();
                let vacancyContainer = this.children[0]; // контейнер с вакансией
                let vacancyName = vacancyContainer.getElementsByClassName("vacancy__title_name")[0];
                let vacancyTitle = vacancyName.parentNode;
                let vacancyBody = vacancyTitle.nextElementSibling;
                vacancyTitle.style.top = "0px";
                vacancyBody.style.top = "0px";
                vacancyBody.style.height = "100%";
            }, false);
        }
    }
    
    // выпадающее меню
    let pmenuToggler = document.querySelector(".js-top-menu");
    let pmenuTogglerInner = document.querySelector(".js-top-menu-inner");
    let pmenuBody = document.querySelector(".pmenu");
    pmenuToggler.addEventListener("click", function(e){
        e.preventDefault();
        if (pmenuBody.classList.contains("active"))
        {
            pmenuBody.classList.remove("active");
            pmenuToggler.parentNode.classList.remove("active");
            document.querySelector("body").classList.remove("popup-open");
        }
        else
        {
            pmenuBody.classList.add("active");
            pmenuToggler.parentNode.classList.add("active");
            document.querySelector("body").classList.add("popup-open");
        }
    }, false);
    pmenuTogglerInner.addEventListener("click", function(e){
        e.preventDefault();
        if (pmenuBody.classList.contains("active"))
        {
            pmenuBody.classList.remove("active");
            pmenuToggler.parentNode.classList.remove("active");
            document.querySelector("body").classList.remove("popup-open");
        }
    }, false);

    // видео: пропорции
    let players = ['iframe[src*="youtube.com"]', 'iframe[src*="vimeo.com"]'];
    let fitVideos = document.querySelectorAll(players.join(","));
    if (fitVideos.length) {
        for (i = 0; i < fitVideos.length; i++) {
            // Get Video Information
            let fitVideo = fitVideos[i];
            let width = fitVideo.getAttribute("width");
            let height = fitVideo.getAttribute("height");
            let aspectRatio = height / width;
            let parentDiv = fitVideo.parentNode;

            let div = document.createElement("div");
            div.className = "popup-video__frame";
            div.style.paddingBottom = aspectRatio * 100 + "%";
            parentDiv.insertBefore(div, fitVideo);
            fitVideo.remove();
            div.appendChild(fitVideo);

            fitVideo.removeAttribute("height");
            fitVideo.removeAttribute("width");
        }
    }

    // автомасштабирование textarea
    const textarea = document.getElementsByTagName("textarea");
    if (textarea.length){
        for (let i = 0; i < textarea.length; i++) {
          textarea[i].setAttribute("style", "height:" + (textarea[i].scrollHeight) + "px;overflow-y:hidden;");
          textarea[i].addEventListener("input", TextareaOnInput, false);
        }
    }
    
    // слайдер типа range
	const range = document.querySelector(".range");
	if (range != null){
		document.querySelector(".range").classList.add('js');
		
		function rangeMonitor(e){
			let _t;
			if (e == undefined) _t = document.querySelectorAll('.range input[type="range"]')[0];
			else _t = _t = e.target; 
			let _p = _t.parentNode, 
				val = +_t.value,
				_o = _p.querySelector(`option[value='${val}']`), 
				lbl = +_o.label;
	
			_t.setAttribute('aria-valuetext', lbl);
			_p.style.setProperty(`--${_t.id}`, val);
			_p.style.setProperty(`--lbl-${_t.id}`, lbl+"");
			_p.style.setProperty(`--wd`, _p.clientWidth);
		}
	
		document.querySelectorAll('.range input[type="range"]')[0].addEventListener('input', rangeMonitor, false);
		document.querySelectorAll('.range input[type="range"]')[1].addEventListener('input', rangeMonitor, false);
		rangeMonitor();
	}
    
    // выпадающее видео
    let videoOpener = document.querySelector(".js-popup-video-open");
    let videoCloser = document.querySelector(".js-popup-video-close");
    let videoBody = document.querySelector(".popup-video");
    if (videoOpener!= null) {
        videoOpener.addEventListener("click", function(e){
            e.preventDefault();
            videoBody.classList.add("active");
            document.querySelector("body").classList.add("popup-open");
        }, false);
        videoCloser.addEventListener("click", function(e){
            e.preventDefault();
            videoBody.classList.remove("active");
            document.querySelector("body").classList.remove("popup-open");
        }, false);
    }
    
    // выпадающая форма обратной связи
    let feedbackOpener = document.querySelectorAll(".js-popup-feedback-open");
    let feedbackCloser = document.querySelector(".js-popup-feedback-close");
    let feedbackSubmiter = document.querySelector(".js-popup-feedback-send");
    let bodyOpened;
    for (i=0; i<feedbackOpener.length; i++){
        let feedbackBody = document.querySelector(".popup-feedback");
        let feedbackBodyContent = document.querySelector(".popup-feedback__content");
        if (feedbackOpener[i]!= null) {
            feedbackOpener[i].addEventListener("click", function(e){
                e.preventDefault();
                feedbackBody.classList.add("active");
                document.querySelector("body").classList.add("popup-open");
                bodyOpened = document.querySelector(".popup-open");
                if (bodyOpened != null){
                    bodyOpened.addEventListener("click", function(e){
                        if (e.target.classList.contains("popup-feedback") || e.target.parentNode.classList.contains("popup-feedback")){
                            feedbackBody.classList.remove("active");
                            document.querySelector("body").classList.remove("popup-open");
                        }
                    }, false);
                }
            }, false);
            feedbackCloser.addEventListener("click", function(e){
                e.preventDefault();
                feedbackBody.classList.remove("active");
                document.querySelector("body").classList.remove("popup-open");
            }, false);
            feedbackSubmiter.addEventListener("click", function(e){
                e.preventDefault();
                feedbackBodyContent.classList.add("popup-feedback__content_success");
                setTimeout(function(){
                    feedbackBody.classList.remove("active");
                    document.querySelector("body").classList.remove("popup-open");
                    feedbackBodyContent.classList.remove("popup-feedback__content_success");
                }, 4000);
            }, false);
        }
    }
    
    
    // круг с цифрами
    let circleText = document.querySelector(".circle-text");
    let circlePic = document.querySelector(".circle-pic");
    
    if (circlePic!= null) {
        circlePic.classList.add("rotating");
        let num = 2;
        setInterval(function(){
            for (i=0; i<circleText.children.length; i++){
                circleText.children[i % circleText.children.length].style.display = "none";
            }
            circleText.children[num % circleText.children.length].style.display = "block";
            num++;
        }, 5000);
    }
    
    if (document.querySelector('.js-map-container'))
    {
        new ContactMap(document.querySelector('.js-map-container'),
            document.querySelectorAll('.js-map-address'),
            document.querySelector('.js-map-select'));
    }
    
    // кастомный селект
    if (document.querySelector('.select'))
    {
        let selectsByClass, i, j, sbcLength, SBTLength, selectsByTag, divCreated, div2Created, div3Created;
        /* Look for any elements with the class "select": */
        selectsByClass = document.getElementsByClassName("select");
        sbcLength = selectsByClass.length;

        for (i = 0; i < sbcLength; i++) {
          selectsByTag = selectsByClass[i].getElementsByTagName("select")[0];
          SBTLength = selectsByTag.length;
          /* For each element, create a new DIV that will act as the selected item: */
          divCreated = document.createElement("DIV");
          divCreated.setAttribute("class", "select-selected");
          divCreated.innerHTML = selectsByTag.options[selectsByTag.selectedIndex].innerHTML;
          
		  //divCreated.innerHTML = Array.prototype.slice.call(selectsByTag.selectedOptions);
          selectsByClass[i].appendChild(divCreated);
          /* For each element, create a new DIV that will contain the option list: */
          div2Created = document.createElement("DIV");
          div2Created.setAttribute("class", "select-items select-hide");

          for (j = 0; j < SBTLength; j++) {
            /* For each option in the original select element,
            create a new DIV that will act as an option item: */
            div3Created = document.createElement("DIV");
            div3Created.innerHTML = selectsByTag.options[j].innerHTML;

            if (j == 0) {div3Created.setAttribute("class", "same-as-selected");}
            /*custom options*/
            if  (selectsByTag.options[j].value == "ios" ||
                 selectsByTag.options[j].value == "android" ||
                 selectsByTag.options[j].value == "web" ||
                 selectsByTag.options[j].value == "other")
            {
                newClass = "iconed_" + selectsByTag.options[j].value;
                div3Created.classList.add("iconed");
                div3Created.classList.add(newClass);
            }
            
            div3Created.addEventListener("click", function(e) {

                function updateSelect(removed, change, eHTML, placeh) {
                    selectSelected = document.getElementsByClassName("select-selected");
                    let sll = selectSelected.length
                    const placeholder = placeh || 'Выберите';
                    for (let one = 0; one < sll; one++) {
                        if (eHTML == selectSelected[one].innerHTML) {
                            if(removed) {
                                selectSelected[one].innerHTML = selectSelected[one].innerHTML.split(', ').filter(function(f) { return f !== removed }).join(', ');
                                if(!selectSelected[one].innerHTML) {
                                    selectSelected[one].innerHTML = placeholder;
                                }
                            } else {
                                if(selectSelected[one].innerHTML != placeholder) {
                                    selectSelected[one].innerHTML = selectSelected[one].innerHTML.concat(', ' + change)
                                } else {
                                    selectSelected[one].innerHTML = change;
                                }
                            }
                        }
                    }
                }

                /* When an item is clicked, update the original select box,
                and the selected item: */
                let optionSelected, i, k, selectsByTagDiv3, pvsSibling, sl, yl;
                selectsByTagDiv3 = this.parentNode.parentNode.getElementsByTagName("select")[0];
                const isMultiple = selectsByTagDiv3.id.startsWith('multiple')
                sl = selectsByTagDiv3.length;
                pvsSibling = this.parentNode.previousSibling;
                for (i = 0; i < sl; i++) {
                    if (selectsByTagDiv3.options[i].innerHTML == this.innerHTML) {
                        selectsByTagDiv3.selectedIndex = i;
                        if(!isMultiple){
                            pvsSibling.innerHTML = this.innerHTML
                        }
                        optionSelected = this.parentNode.getElementsByClassName("same-as-selected");
                        yl = optionSelected.length;
                        let removed = false;
                        if(isMultiple) {
                            for (k = 0; k < yl; k++) {
                                if(optionSelected[k]?.innerHTML == this.innerHTML) {
                                    removed = optionSelected[k]?.innerHTML; //  check why triggering error
                                    optionSelected[k]?.classList.remove("same-as-selected");
                                }
                            }
                        } else {
                            for (k = 0; k < yl; k++) {
                                optionSelected[k].classList.remove("same-as-selected");
                            }
                            this.classList.add("same-as-selected");

                        }
                        if(isMultiple){
                            if (!removed) {
                                this.classList.add("same-as-selected");
                            }
                            const change = removed || this.innerHTML;
                            updateSelect(removed, change, pvsSibling.innerHTML, selectsByTagDiv3.name);
                        }
                        break;
                    }
                }
                if(!isMultiple){
                    pvsSibling.click(); // ???
                }
            });
            div2Created.appendChild(div3Created);
          }
          
          selectsByClass[i].appendChild(div2Created);
          divCreated.addEventListener("click", function(e) {
            /* When the select box is clicked, close any other select boxes,
            and open/close the current select box: */
            e.stopPropagation();
            closeAllSelect(this);
            this.nextSibling.classList.toggle("select-hide");
            this.classList.toggle("select-arrow-active");
          });
        }

        /* If the user clicks anywhere outside the select box,
        then close all select boxes: */
        document.addEventListener("click", closeAllSelect);
    }

    // блок с фото сотрудников
    if (document.querySelectorAll(".js-team-container").length > 0)
    {
        let container = document.querySelector(".js-team-container");

        let sliderTeam = tns({
            container: '.js-team-container .team__list',
            items: 4,
            gutter: 15,
            responsive: {
                320: {
                    items: 1
                },
                640: {
                    items: 2
                },
                992: {
                    items: 4
                }
            },
            axis: "horizontal",
            controls: false,
            navPosition: 'bottom',
            mouseDrag: true,
            slideBy: 'page'
        });
    }

    // блок с рандомными проектами
    if (document.querySelectorAll(".js-randomcases-container").length > 0)
    {
        let container = document.querySelector(".js-randomcases-container");
        
        for (i=0; i<4; i++)
        {
            let random = Math.floor(1 + Math.random() * container.children[0].childElementCount);
            child = document.querySelector('.js-randomcases-container > .some-projects__list > .cases__case:nth-child(' + random + ')');
            if (child)
                child.remove();
        }
        let cases = Array.prototype.slice.call(container.children[0].children);

        let sliderCases = tns({
            container: '.js-randomcases-container .some-projects__list',
            items: 4,
            gutter: 15,
            responsive: {
                320: {
                    items: 1,
                    nav: true
                },
                640: {
                    items: 2,
                    nav: true
                },
                992: {
                    items: 4,
                    nav: false
                }
            },
            controls: false,
            nav: false,
            navPosition: 'bottom',
            mouseDrag: true,
            slideBy: 'page'
        });
    }

    // аккордеон
    if (document.querySelectorAll(".js-accordion").length > 0)
    {
        let container = document.querySelector(".js-accordion");
        let accItems = Array.prototype.slice.call(container.children);
        for (i=0; i<accItems.length; i++){
            accItems[i].addEventListener("click", function(e){
                e.preventDefault();
                e.target.parentNode.classList.toggle("active");
            }, false);
        }
    }

    // блок с годами
    if (document.querySelectorAll(".js-years").length > 0)
    {
        let container = document.querySelector(".js-years");
        
        let cases = Array.prototype.slice.call(container.children[0].children);

        let sliderYears = tns({
            container: '.js-years',
            items: 1,
            controls: false,
            navPosition: 'bottom',
            mouseDrag: true,
            slideBy: 'page',
            autoplay: true,
            autoplayTimeout: 3000,
            autoplayButton: false,
            autoplayButtonOutput: false
        });

        const slideCircle = (() => {
            const info = sliderYears.getInfo();
            let num = info.displayIndex-1;
            //let data = switcherItems[clickedIndex].dataset;
            
            const bullet = document.querySelector(".js-year-circle");
            const yearnum = document.querySelector(".js-year-number");
            bullet.style.left = 100*num/(info.slideCount-1) + "%";
            yearnum.innerHTML = info.slideItems[info.displayIndex].dataset.year;
            
        });
        
        slideCircle();
        sliderYears.events.on('transitionEnd', slideCircle);
    }


});