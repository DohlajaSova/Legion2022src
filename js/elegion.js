function docReady(fn) {
    if (document.readyState === "complete" || document.readyState === "interactive") {
        setTimeout(fn, 1);
    } else {
        document.addEventListener("DOMContentLoaded", fn);
    }
}

function debounce(f, ms) {
    let isCooldown = false;
    return function () {
        if (isCooldown) return;
        f.apply(this, arguments);
        isCooldown = true;
        setTimeout(() => isCooldown = false, ms);
    };
}

function hasCommonElements(a, b) {
    b = new Set(b);
    return a.some(x => b.has(x));
}

function findOffset(element) {
    let top = 0, left = 0;

    do {
        top += element.offsetTop || 0;
        left += element.offsetLeft || 0;
        element = element.offsetParent;
    } while (element);

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

function toggleClass(elem, className, toggle = null) {
    if (toggle === null) {
        if (elem.classList.contains(className)) {
            elem.classList.remove(className);
        } else {
            elem.classList.add(className);
        }
    } else {
        toggle ? elem.classList.add(className) : elem.classList.remove(className);
    }
}

function ContactMap(container, switcherItems, selectControl) {
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
        if (target.parentNode) {
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
        let onClick = function () {
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
        window.map_initialized = function () { init(); };
        let getUrl = function () {
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

function ContactMapYandex(containers, switcherItems, selectControl) {
    function init() {
        ymaps.ready(function () {
            for (let container of containers) {
                let data = container.previousElementSibling.dataset;
                let lat = data.centerLat || data.markerLat;
                let lng = data.centerLng || data.markerLng;
                let zoom = data.zoom;
                let map = new ymaps.Map(container, {
                    center: [lat, lng],
                    zoom: zoom
                });
                putMarkers(map);
                drawRoutes(map);
                insertAddress(container);
            }
        });
    }
    
    function insertAddress(container){
        let addrBlock = container.parentElement.querySelector('.map__addresses_block');
        let telephone = addrBlock.querySelector('[itemprop="telephone"]').innerHTML;
        let email = addrBlock.querySelector('[itemprop="email"]').innerHTML;
        let country = addrBlock.querySelector('[itemprop="addressCountry"]').innerHTML;
        let city = addrBlock.querySelector('[itemprop="addressLocality"]').innerHTML;
        let postalCode = addrBlock.querySelector('[itemprop="postalCode"]').innerHTML;
        let streetAddress = addrBlock.querySelector('[itemprop="streetAddress"]').innerHTML;
        let metro = addrBlock.querySelector('.js-map-metro') == null? '' : addrBlock.querySelector('.js-map-metro').innerHTML;
        let addrShort = document.createElement("div");
        addrShort.innerHTML = '<a href="tel:'+telephone.replace(/&nbsp;/g, '')+'">'+telephone+'</a><br><a href="mailto:'+email+'">'+email+'</a>';
        addrShort.classList.add('addr_short');
        let addrFull = document.createElement("div");
        addrFull.innerHTML = country+", "+city+", "+postalCode+", "+streetAddress;
        addrFull.classList.add('addr_full');
        if (metro) addrFull.innerHTML += ", "+metro;
        container.parentNode.insertBefore(addrShort, container);
        container.insertAdjacentElement("afterend", addrFull);
    }

    function putMarkers(map) {
        for (let container of containers) {
            for (let item of switcherItems) {
                let data = item.dataset;
                officePlacemark = new ymaps.Placemark([data.markerLat, data.markerLng], {}, {
                    iconLayout: 'default#image',
                    iconImageHref: container.dataset.markerImage,
                    iconImageSize: [48, 48],
                    iconImageOffset: [-24, -48]
                });
                map.geoObjects.add(officePlacemark)
            }
        }
    }

    function drawRoutes(map) {
        for (let item of switcherItems) {
            let data = item.dataset;
            if (!data.routePoints) {
                continue;
            }
            let points = data.routePoints.split('; ').map((x) => x.split(',').map(parseFloat));
            let path = [];
            for (let point of points) {
                path.push(point);
            }
            let officePath = new ymaps.GeoObject({
                geometry: {
                    type: 'LineString',
                    coordinates: path
                }
            },
                {
                    strokeColor: 'rgb(35, 168, 224)',
                    strokeWidth: 3
                });

            map.geoObjects.add(officePath);
        }
    }

    function load() {
        let getUrl = function () {
            let base = 'https://api-maps.yandex.ru/2.1';
            let options = {
                apikey: containers[0].dataset.apiKeyYandex,
                lang: containers[0].dataset.lang
            };
            let args = objToQuery(options);
            return [base, args].join('?');
        };
        let script = document.createElement("script");
        script.src = getUrl();
        document.body.appendChild(script);
        script.onload = init;
    }

    if (containers) {
        load();
    }
}

function TextareaOnInput() {
    this.style.height = "auto";
    this.style.height = (this.scrollHeight) + "px";
}

function portfolioRefresh(limit) {
    let portfolioBlocks = document.querySelectorAll(".js-cases-container-portfolio .container_portfolio-inner")[0];
    let moreButton = document.querySelectorAll(".js-cases-more")[0];
    let shown = 0;
    for (let i = 0; i < portfolioBlocks.children.length; i++) {
        portfolioBlocks.children[i].classList.add("not-shown");
    }
    for (let i = 0; i < portfolioBlocks.children.length; i++) {
        if (!portfolioBlocks.children[i].classList.contains("hide")) {
            shown++;
            if (shown <= limit)
                portfolioBlocks.children[i].classList.remove("not-shown");
        }
    }
    let zeroC = portfolioBlocks.querySelectorAll('.zero-case')
    if (shown === 0 && zeroC) {
        zeroC[0].style.visibility = 'visible';
        zeroC[1].style.visibility = 'visible';
        zeroC[0].style.display = 'block';
        zeroC[1].style.display = 'block';
        randomizeCases();
    } else if (zeroC) {
        zeroC[0].style.visibility = 'hidden';
        zeroC[1].style.visibility = 'hidden';
        zeroC[0].style.display = 'none';
        zeroC[1].style.display = 'none';
    }
    if (shown <= limit)
        moreButton.parentNode.classList.add("hide");
}
function randomizeCases() {
    const container = document.querySelector(".js-randomcases-container");
    const childCount = container.children[0].childElementCount;
    if (container.querySelector('.service__feature_inner-case__visual') && childCount > 4) {
        let rand = [];
        for (let i = 1; i < childCount + 1; i++) {
            const child = document.querySelector('.js-randomcases-container > .service__feature_inner-case__visual > .service__feature_inner-case__visual_wrapper:nth-child(' + i + ')');
            if (child)
                child.classList.add('display-none');
        }
        for (let i = 0; i < 4; i++) {
            const random = getRandomNumber(rand, childCount)
            const child = document.querySelector('.js-randomcases-container > .service__feature_inner-case__visual > .service__feature_inner-case__visual_wrapper:nth-child(' + random + ')');
            if (child)
                child.classList.remove('display-none');
            rand.push(random)

        }
    }
}
function getRandomNumber(exclude, limit) {
    let result = Math.floor(1 + Math.random() * limit);
    if (!~exclude.indexOf(result)) {
        return result;
    } else return getRandomNumber(exclude, limit);
}
function vacanciesRefresh(limit) {
    let vacanciesBlocks = document.querySelectorAll(".js-vacancies-container .vacancies__container_inner")[0];
    let moreButton = document.querySelectorAll(".js-vacancies-more")[0];
    let shown = 0;
    for (let i = 0; i < vacanciesBlocks.children.length; i++) {
        vacanciesBlocks.children[i].classList.add("not-shown");
    }
    for (let i = 0; i < vacanciesBlocks.children.length; i++) {
        if (!vacanciesBlocks.children[i].classList.contains("hide")) {
            shown++;
            if (shown <= limit)
                vacanciesBlocks.children[i].classList.remove("not-shown");
        }
    }
    if (shown <= limit && moreButton)
        moreButton.parentNode.classList.add("hide");
    else if (moreButton)
        moreButton.parentNode.classList.remove("hide");
}
function vacanciesTransition(n, perpage) {
    let vacanciesBlocks = document.querySelectorAll(".js-vacancies-container .vacancies__container_inner")[0];
    let page = document.querySelectorAll(".js-vacancies-container")[0].dataset.page;
    if (!page || page === n) return;

    document.querySelectorAll(".js-vacancies-container")[0].dataset.page = n;
    page = n;

    for (let i = 0; i < vacanciesBlocks.children.length; i++) {
        vacanciesBlocks?.children[i]?.classList.add("not-shown");
    }

    for (let i = page * perpage; i < page * perpage + perpage; i++) {
        vacanciesBlocks?.children[i]?.classList.remove("not-shown");
    }
}

function checkFieldValid(element) {
    if (!element.value || element.value < 2) {
        addListenerInput(element);
        return false;
    }
    // if(element.type === 'tel'){
    //     let v = element.value.replace(/\D+/g,"");
    //     if(v.length != 10) {
    //         addListenerInput(element);
    //         return false;
    //     }
    // }
    if (element.type === 'email') {
        var pattern = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        //"
        if (!element.value.match(pattern)) {
            addListenerInput(element);
            return false;
        }
    }
    return true;
}
// rmClass(this.parentNode.parentNode, 'active', 'siblings', one); example
// function rmClass(node, className, mode, exclude = 0){
//     if(mode){
//         if(mode === 'siblings'){
//             if(exclude) {
//                 let arr = node.childNodes.filter(className);
//             }
//         }
//     }
//     node.classList.remove(className)
// }

function addListenerInput(el) {
    el.addEventListener("input", function input() {
        el.classList.remove("error");
        el.removeEventListener("input", input, false);
    })
}

function initVideo() {
    var vidDefer = document.getElementsByTagName('iframe');
    for (var i = 0; i < vidDefer.length; i++) {
        if (vidDefer[i].getAttribute('data-src')) {
            vidDefer[i].setAttribute('src', vidDefer[i].getAttribute('data-src'));
        }
    }
}

function containerRefresh(limit, container, moreButton) {
    // let blocks = document.querySelectorAll(".js-cases-container-portfolio .container_portfolio-inner")[0];
    let shown = 0;
    // for (let i=0; i<container.children.length; i++){
    //     container.children[i].classList.add("not-shown");
    // }
    for (let i = 0; i < container.children.length; i++) {
        if (!container.children[i].classList.contains("hide")) {
            shown++;
            if (shown <= limit)
                container.children[i].classList.remove("not-shown");
        }
    }
    if (shown <= limit)
        moreButton.parentNode.classList.add("hide");
}

function removeOverBlocks(container, limit, stable, data, moreButton) {
    // const isComplex = ~container.classList.value.indexOf("news__grid_card-complex");
    // const lm = limit || isComplex && 2;
    if (limit) {
        let colored = false;
        let visible = +limit;
        const childs = container.children;
        for (let one = 0; one < childs.length; one++) {
            let block = container?.children[one];
            if (visible && !~block.classList.value.indexOf("hide")) {
                visible--;
                block.classList.remove("over-limit");
            } else {
                block.classList.add("over-limit");
            }
            // stable - только как признак того, что нужно перекрасить 1й блок
            if (stable && ~container.classList.value.indexOf("news__grid_card-complex") && !~block.classList.value.indexOf("hide")) {
                // if data.coloredBlock
                setBackground(block, colored);
                colored = true;
            }
        }
        if (moreButton && !stable) {
            let ar = Array.prototype.slice.call(childs);
            const hidden = ar.filter(one => ~one.classList.value.indexOf("hide")).length
            if (childs.length <= limit) {
                moreButton.classList.add("hide");
            } else if (childs.length - hidden <= limit) {
                moreButton.classList.add("hide");
            } else {
                moreButton.classList.remove("hide");
            }
        }
    }
}

function setBackground(block, colored) {
    if (!colored) {
        block.classList.add("first");
    } else {
        block.classList.remove("first");
    }
}
function smoothScrollOnLinkHash(selector) {
    const el = document.getElementById(selector)
    if (el) {
        el.scrollIntoView({
            behavior: "smooth"
        })
    }
}

function getParamsByUrl(url = null) {
    let queryUrl = url ? url : location.search
    let queryString = queryUrl.substring(1)
    let res = new URLSearchParams(queryString)
    let urlParams = {}

    res.forEach((value, key) => {
        if (value === 'null') value = null
        if (value === 'undefined') value = null
        if (value === '') value = null
        urlParams[key] = value
    })

    return urlParams
}

function copyURI(evt) {
    evt.preventDefault();
    navigator.clipboard.writeText(evt.target.getAttribute('href')).then(() => {
    });
}

function telegramForwardButton($url, $text = '') {
    let share_url = 'https://t.me/share/url?url=' + encodeURIComponent($url) + '&text=' + encodeURIComponent($text);
    return share_url;
}

function vkForwardButton($url) {
    let share_url = encodeURIComponent($url);
    return share_url;
}

function generateEditorialTOC(editorial) {
    let toc = '';
    const headings = editorial.querySelectorAll('h2');
    if (headings.length) {
        // формируем оглавление
        headings.forEach(function (heading, index) {
            let headName = heading.innerHTML;
            heading.innerHTML = '<a name="head' + index + '" id="#head' + index + '"></a>' + headName;
            toc += '<h3><a href="#head' + index + '" class="js-scrollto">' + headName + '</a></h3>';
        });

        // разбиваем статью на блоки <section> по вхождению заголовков <h2>
        let sectioned = editorial.innerHTML.replace(/(([\s\S]*?)<h2>([\s\S]*?)<\/h2>)+?/gm, '<section>$2</section><h2>$3</h2>');
        sectioned = sectioned.replace(/<h2>([\s\S]*)<\/h2>([\s\S]+)/gm, '<h2>$1</h2><section>$2</section>');
        editorial.innerHTML = sectioned;
    }

    if (toc != "") {
        toc = '<aside class="editorial-container__toc js-toc"><a href="#" class="sidetoc-menu js-sidetoc"></a><div class="editorial-container__toc-inner hide">' + toc + '<a href="javascript:;" onclick="document.location.hash=\'top\';" class="back js-top"></a></div><a href="javascript:;" onclick="document.location.hash=\'top\';" class="back back-mobile js-top"></a></aside>';
    }
    else toc = '<aside class="editorial-container__toc"></aside>'

    // добавляем шаринг к футер статьи
    let shareblock = '<div class="social social-editorial">';
    shareblock += '<a href="https://vk.com/share.php?url=' + vkForwardButton(window.location.href) + '" class="button button_grey button_small social_vk" target="_blank"></a>';
    shareblock += '<a href="' + telegramForwardButton(window.location.href) + '" class="button button_grey button_small social_t" target="_blank"></a>';
    shareblock += '<a href="' + window.location.href + '" onclick="copyURI(event)" class="button button_grey button_small social_text">Скопировать ссылку</a>';
    shareblock += '</div>';

    let div = document.createElement('div');
    div.className = 'container editorial-container';
    if (editorial != '') div.innerHTML = toc + '<article class="custom-format editorial-container__body js-editorial" itemprop="articleBody">' + editorial.innerHTML + shareblock + '</article>';
    editorial.before(div);
    document.querySelectorAll('.js-editorial')[1].remove();

    const sidebarElements = Array.from(document.getElementsByClassName('js-scrollto'));
    if (sidebarElements.length) {
        sidebarElements.forEach(function (sidebarElement, index) {
            sidebarElements[index].addEventListener('click', function (event) {
                event.preventDefault();
                let element = document.getElementById(event.target.getAttribute('href'));
                const y = element.getBoundingClientRect().top + window.pageYOffset;
                window.scrollTo({ behavior: "smooth", top: y });
            })
        })
    }

    // фиксим оглавление статьи при скролле
    const stickyTOC = document.getElementsByClassName('js-toc')[0];
    if (stickyTOC != undefined) {
        const editorialBody = document.getElementsByClassName('js-editorial')[0];
        //let editorialTop = editorialBody.offsetTop; bug in mobile
        let editorialTop = document.getElementsByClassName('header')[0].getBoundingClientRect().height + document.getElementsByClassName('top_news')[0].getBoundingClientRect().height;
        let editorialHeight = document.getElementsByClassName('editorial-container')[0].getBoundingClientRect().height + 167;
        let bodyScrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        const wWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        const wHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
        let topAdjust = 0;
        if (wWidth <= 650) topAdjust = 102;
        if (wWidth > 1024 && document.getElementsByClassName('editorial-container__toc-inner')[0] != undefined)
            document.getElementsByClassName('editorial-container__toc-inner')[0].classList.remove('hide');

        // 0. подсвечиваем активный заголовок
        // 1. массив заголовков, их топ-координаты относительно скролла
        // 2. если какой-то заголовок попадает в область (видимость или выше), помечаем его активным
        // 3. в правом блоке подсвечиваем последний из активных, все остальные убираем
        const allHeadings = editorialBody.getElementsByTagName('h2');
        const allTOCHeadings = stickyTOC.getElementsByTagName('h3');
        let allHeadingsTops = new Array();
        if (allHeadings.length) {
            Array.prototype.slice.call(allHeadings).forEach(function (heading, index) {
                allHeadingsTops[index] = allHeadings[index].offsetTop;
            });
        }

        function placeEditorialTOC() {
            bodyScrollTop = document.documentElement.scrollTop || document.body.scrollTop;
            let TOCHeight = document.getElementsByClassName('editorial-container__toc-inner')[0].getBoundingClientRect().height;
            stickyTOC.style.height = TOCHeight + 68 + "px";
            if (bodyScrollTop > editorialTop + 67) {
                document.getElementsByClassName('editorial-container__toc-inner')[0].classList.add('fixed');
                stickyTOC.classList.add('fixed');
                if (wWidth > 1024 && document.getElementsByClassName('editorial-container')[0] != undefined) {
                    if (bodyScrollTop > editorialTop + document.getElementsByClassName('editorial-container')[0].getBoundingClientRect().height - document.getElementsByClassName('editorial-container__toc-inner')[0].getBoundingClientRect().height - 79)
                        document.getElementsByClassName('editorial-container')[0].classList.add('floored');
                    else
                        document.getElementsByClassName('editorial-container')[0].classList.remove('floored');
                }
            }
            else {
                document.getElementsByClassName('editorial-container__toc-inner')[0].classList.remove('fixed');
                stickyTOC.classList.remove('fixed');
            }

            if (allHeadings.length) {
                let activeHeading = -1;
                for (i = 0; i < allHeadings.length; i++) {
                    if (bodyScrollTop > (allHeadings[i].getBoundingClientRect().top + window.scrollY - wHeight)) {
                        activeHeading = i;
                    }
                }
                Array.prototype.slice.call(allHeadings).forEach(function (heading, index) {
                    if (index == activeHeading) {
                        allTOCHeadings[index].classList.add('active');
                    }
                    else {
                        allTOCHeadings[index].classList.remove('active');
                    }
                });
            }
            else {
                Array.prototype.slice.call(allHeadings).forEach(function (heading, index) {
                    allTOCHeadings[index].classList.remove('active');
                });
            }
        }
        placeEditorialTOC();
        window.addEventListener('touch', placeEditorialTOC, true);
        window.addEventListener('scroll', placeEditorialTOC, true);
        window.addEventListener('resize', placeEditorialTOC, true);
    }
}

function generateCaseTOC(caseOuter) {
    caseOuter.innerHTML = caseOuter.innerHTML.replace(/<h6 class="js-case-accordion-begin"><\/h6>([\s\S]+)<h6 class="js-case-accordion-end"><\/h6>/gm, '<div class="js-case">$1</div>');

    let case1;
    if (document.querySelectorAll(".js-case")[0] != undefined) {
        case1 = document.querySelectorAll(".js-case")[0];

        // разбиваем блок аккордеона на блоки <section> по вхождению заголовков <h6>
        let sectioned = case1.innerHTML.replace(/(([\s\S]*?)<h6>([\s\S]*?)<\/h6>)+?/gm, '<section>$2<a href="" class="close">закрыть/свернуть</a></section><h6 class="container h3">$3</h6>');
        sectioned = sectioned.replace(/<h6 class="container h3">([\s\S]*)<\/h6>([\s\S]+)/gm, '<h6 class="container h3">$1</h6><section>$2<a href="" class="close">закрыть/свернуть</a></section>');
        case1.innerHTML = sectioned;
    }

    let toc = '';
    const headings = caseOuter.querySelectorAll('h3, h6');
    if (headings.length) {
        // формируем оглавление
        headings.forEach(function (heading, index) {
            let headName = heading.innerHTML;
            heading.innerHTML = '<a name="head' + index + '" id="#head' + index + '"></a>' + headName;
            if (heading.tagName == 'H3')
                toc += '<div class="case-container__toc-lev1"><a href="#head' + index + '" class="js-scrollto">' + headName + '</a></div>';
            else
                toc += '<div class="case-container__toc-lev2"><a href="#head' + index + '" class="js-scrollto">' + headName + '</a></div>';
        });
        toc = '<div class="case-container__toc-lev1"><a href="#project" class="js-scrollto">Проект</a></div>' + toc;

    }

    if (toc != "") {
        toc = '<aside class="case-container__toc js-toc"><div class="case-container__toc-inner"><a href="#" class="sidetoc-menu js-sidetoc"></a>' + toc + '</div></aside>';
    }
    else toc = '<aside class="case-container__toc"></aside>'

    if (document.querySelectorAll(".js-case")[0] != undefined) {
        let div = document.createElement('div');
        div.className = 'case-accordion js-case-accordion';
        if (case1 != undefined) div.innerHTML = case1.innerHTML;
        case1.before(div);
        document.querySelectorAll('.js-case')[0].remove();
    }

    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('js-sidetoc')) {
            e.preventDefault();
            if (e.target.classList.contains('closed')) {
                e.target.classList.remove('closed');
                e.target.parentElement.classList.remove('closed');
            }
            else {
                e.target.classList.add('closed');
                e.target.parentElement.classList.add('closed');
            }
        }
    }, true);

    document.addEventListener('click', function (e) {
        if (e.target.parentElement.classList.contains('js-case-accordion')) {
            if (e.target.classList.contains('active'))
                e.target.classList.remove('active');
            else
                e.target.classList.add('active');
        }
    }, true);

    document.addEventListener('click', function (e) {
        if (e.target.parentElement.parentElement.classList.contains('js-case-accordion') && e.target.classList.contains('close')) {
            e.preventDefault();
            e.target.parentElement.previousElementSibling.classList.remove('active');
            window.scrollTo({ behavior: "smooth", top: e.target.parentElement.previousElementSibling.getBoundingClientRect().top + window.pageYOffset });
        }
    }, true);

    div = document.createElement('div');
    div.className = 'js-case-outer';
    div.innerHTML = toc + '<article class="case-container__body" itemprop="articleBody">' + caseOuter.innerHTML + '</article>';
    caseOuter.before(div);
    document.querySelectorAll('.js-case-outer')[1].remove();

    const sidebarElements = Array.from(document.getElementsByClassName('js-scrollto'));
    if (sidebarElements.length) {
        sidebarElements.forEach(function (sidebarElement, index) {
            sidebarElements[index].addEventListener('click', function (event) {
                event.preventDefault();
                let element = document.getElementById(event.target.getAttribute('href'));
                const y = element.getBoundingClientRect().top + window.pageYOffset;
                window.scrollTo({ behavior: "smooth", top: y });
            })
        })
    }

    // фиксим оглавление кейса при скролле
    const stickyTOC = document.getElementsByClassName('js-toc')[0];
    if (stickyTOC != undefined) {
        const caseBody = document.getElementsByClassName('js-case-outer')[0];
        //let caseTop = caseBody.offsetTop; bug in mobile
        //let caseTop = document.getElementsByClassName('header')[0].getBoundingClientRect().height;
        let caseTop = document.getElementsByClassName('case-column')[0].getBoundingClientRect().top + window.pageYOffset - document.getElementsByClassName('header')[0].getBoundingClientRect().height + 40;
        let caseHeight = document.getElementsByClassName('js-case-outer')[0].getBoundingClientRect().height + 167;
        let bodyScrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        const wWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        const wHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
        let topAdjust = 0;
        if (wWidth > 1280) topAdjust = 27;
        else if (wWidth > 1180) topAdjust = -3;
        stickyTOC.style.top = caseTop + 66 + topAdjust + 'px';
        if (wWidth <= 1024 && document.getElementsByClassName('case-container__toc-inner')[0] != undefined) {
            document.getElementsByClassName('case-container__toc-inner')[0].classList.add('closed');
            document.getElementsByClassName('js-sidetoc')[0].classList.add('closed');
        }
        if (wWidth <= 1180 && document.getElementsByClassName('case-container__toc-inner')[0] != undefined) {
            document.getElementsByClassName('js-toc')[0].classList.add('fixed');
            document.getElementsByClassName('case-container__toc-inner')[0]?.classList.add('fixed');
            document.getElementsByClassName('case-container__toc-inner')[0]?.classList.add('closed');
            document.getElementsByClassName('js-sidetoc')[0].classList.add('closed');
        }

        // 0. подсвечиваем активный заголовок
        // 1. массив заголовков, их топ-координаты относительно скролла
        // 2. если какой-то заголовок попадает в область (видимость или выше), помечаем его активным
        // 3. в правом блоке подсвечиваем последний из активных, все остальные убираем
        setTimeout(function(){
            const allHeadings = caseBody.querySelectorAll('h3, h6');
            const allTOCHeadings = stickyTOC.getElementsByTagName('div');
            let allHeadingsTops = new Array();
            if (allHeadings.length) {
                Array.prototype.slice.call(allHeadings).forEach(function (heading, index) {
                    allHeadingsTops[index] = allHeadings[index].offsetTop;
                });
            }
            allHeadingsTops.splice(0, 0, caseBody.getBoundingClientRect().top + window.pageYOffset + 60); // добавили начало кейса

            function placeCaseTOC() {
                bodyScrollTop = document.documentElement.scrollTop || document.body.scrollTop;
                let TOCHeight = document.getElementsByClassName('case-container__toc-inner')[0]?.getBoundingClientRect().height;
                stickyTOC.style.height = TOCHeight + 68 + "px";
                if (bodyScrollTop > caseTop + 50) {
                    document.getElementsByClassName('case-container__toc-inner')[0]?.classList.add('fixed');
                    stickyTOC.classList.add('fixed');
                    if (wWidth > 1024 && document.getElementsByClassName('case-container')[0] != undefined) {
                        if (bodyScrollTop > caseTop + document.getElementsByClassName('js-case-outer')[0].getBoundingClientRect().height - document.getElementsByClassName('case-container__toc-inner')[0].getBoundingClientRect().height - 79)
                            document.getElementsByClassName('js-case-outer')[0].classList.add('floored');
                        else
                            document.getElementsByClassName('js-case-outer')[0].classList.remove('floored');
                    }
                }
                else {
                    document.getElementsByClassName('case-container__toc-inner')[0]?.classList.remove('fixed');
                    stickyTOC.classList.remove('fixed');
                }

                if (allHeadings.length) {
                    let activeHeading = -1;
                    for (i = 0; i < allHeadingsTops.length; i++) {
                        if (bodyScrollTop > (allHeadingsTops[i] - wHeight)) {
                            activeHeading = i;
                        }
                    }
                    Array.prototype.slice.call(allHeadingsTops).forEach(function (heading, index) {
                        if (index == activeHeading) {
                            allTOCHeadings[index + 1].classList.add('active');
                        }
                        else {
                            allTOCHeadings[index + 1].classList.remove('active');
                        }
                    });
                }
                else {
                    Array.prototype.slice.call(allHeadings).forEach(function (heading, index) {
                        allTOCHeadings[index].classList.remove('active');
                    });
                }
            }
            placeCaseTOC();
            // переинициализируем слайдер
            let sliderCases = document.querySelectorAll(".js-cases-slider-groups");
            let sliderCasesLeftArrow = document.querySelectorAll(".js-cases-groups-arrows-left");
            let sliderCasesRightArrow = document.querySelectorAll(".js-cases-groups-arrows-right");
            let sliderCasesSlider = new Array();
            if (sliderCases.length > 0) {
                for (i = 0; i < sliderCases.length; i++) {
                    sliderCasesSlider[i] = tns({
                        container: sliderCases[i],
                        items: 1,
                        nav: false,
                        prevButton: sliderCasesLeftArrow[i],
                        nextButton: sliderCasesRightArrow[i],
                        mouseDrag: true,
                        slideBy: 'page'
                    });
                }
            }
            window.addEventListener('touch', placeCaseTOC, true);
            window.addEventListener('scroll', placeCaseTOC, true);
            window.addEventListener('resize', placeCaseTOC, true);
        }, 50);
    }
}

function setinformerIsRead(clicked, informer){
    let informerContainer = document.querySelectorAll(".js-informer");
    let informerIsRead = new Array();
    
    if (informer != null){
        let infID = informer.parentElement.parentElement.dataset.informerid;
        informerIsRead[infID] = localStorage.getItem('informerIsRead'+infID) || 'false';
        if (informerIsRead[infID] == 'false'){
            localStorage.setItem('informerIsRead'+infID, 'true');
            informer.parentElement.parentElement.classList.add('hide');
        }
    }
    else{
        if (informerContainer.length > 0){
            informerContainer.forEach(function (infItem, index) {
                let infID = infItem.dataset.informerid;
                informerIsRead[infID] = localStorage.getItem('informerIsRead'+infID) || 'false';
                if (informerIsRead[infID] == 'false'){
                    infItem.classList.remove('hide');
                }
            });
        }
    }
}


docReady(function () {
    // global
    // listeners 
    let tagCategoriesListener = false;
    const params = getParamsByUrl();
    const scrollIV = params?.scrollinto;
    if (scrollIV) {
        smoothScrollOnLinkHash(scrollIV);
    }
    // фиксим хедер при скролле
    const stickyHeader = document.getElementsByClassName('header')[0];
    //let headerOffset = findOffset(stickyHeader);
    let lastScrollTop = 0;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    let i, j;
    // const backButton = document.querySelector(".js-top");
    const wHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
    if (windowWidth <= 650) {
        window.onscroll = function () {
            let bodyScrollTop = document.documentElement.scrollTop || document.body.scrollTop;
            if (bodyScrollTop > 50) {
                stickyHeader.classList.add('header_scrolled');
            } else {
                stickyHeader.classList.remove('header_scrolled');
            }

            if (bodyScrollTop > wHeight) {
                if (bodyScrollTop > lastScrollTop) {
                    stickyHeader.classList.remove('header_shift');
                } else {
                    stickyHeader.classList.add('header_sticky');
                    stickyHeader.classList.add('header_transparent');
                    stickyHeader.classList.add('header_shift');
                }
            } else {
                stickyHeader.classList.remove('header_shift');
                setTimeout(() => {
                    stickyHeader.classList.remove('header_transparent');
                    stickyHeader.classList.remove('header_sticky');
                }, 500);
            }
            lastScrollTop = bodyScrollTop <= 0 ? 0 : bodyScrollTop;


            // if (bodyScrollTop < 500) backButton?.classList.add("hide");
            // else backButton?.classList.remove("hide");
        };
    }
    // else {
    //     window.onscroll = function () {
    //         let bodyScrollTop = document.documentElement.scrollTop || document.body.scrollTop;

    //         if (bodyScrollTop < 500) backButton.classList.add("hide");
    //         else backButton.classList.remove("hide");
    //     }
    // }

    // обработка свайпа
    const sliders = document.querySelectorAll('.cases-slider');
    if (sliders.length) {
        sliders.forEach((slider, index) => swipe(slider, index));
    }
    function swipe(slider, index) {
        let active = document.querySelectorAll(index ? '.project-with-slider .active' : '.cases__case .active');
        slider.addEventListener('touchstart', (e) => {
            touchstartX = e.changedTouches[0].screenX;
        }, false);
        slider.addEventListener('touchend', (e) => {
            touchendX = e.changedTouches[0].screenX;
            if (touchstartX > touchendX) {
                active.forEach((el) => {
                    const next = el.nextElementSibling;
                    if (next) {
                        el.classList.remove('active');
                        next.classList.add('active');
                    } else {
                        return;
                    }
                });
            } else {
                active.forEach((el) => {
                    const prev = el.previousElementSibling;
                    if (prev) {
                        el.classList.remove('active');
                        prev.classList.add('active');
                    } else {
                        return;
                    }
                });
            }
            active = document.querySelectorAll(index ? '.project-with-slider .active' : '.cases__case .active');
        }, false);
    }


    // слайдер с проектом
    let sliderDots = document.querySelectorAll(".js-cases-dots");
    for (i = 0; i < sliderDots.length; i++) {
        sliderDots[i].addEventListener("click", function (e) {
            e.preventDefault();
            let slider = this.previousElementSibling; // контейнер со слайдами
            let sliderControlsContainer = this; // кликнутая точка
            if (e.target.tagName == "A") {
                let sliderControls = Array.prototype.slice.call(e.target.parentNode.parentNode.children); // контейнер с точками
                let clickedItemNumber = sliderControls.indexOf(e.target.parentNode); // номер кликнутого элемента
                for (i = 0; i < slider.children.length; i++) {
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
    for (i = 0; i < sliderInfoDots.length; i++) {
        sliderInfoDots[i].addEventListener("click", function (e) {
            e.preventDefault();
            let slider = this.parentNode.previousElementSibling; // контейнер со слайдами
            let sliderControlsContainer = this; // кликнутая точка
            if (e.target.tagName == "A") {
                let sliderControls = Array.prototype.slice.call(e.target.parentNode.parentNode.children); // контейнер с точками
                let clickedItemNumber = sliderControls.indexOf(e.target.parentNode); // номер кликнутого элемента
                for (i = 0; i < slider.children[0].children.length; i++) {
                    slider.children[0].children[i].classList.remove("active");
                    sliderControls[i].classList.remove("active");
                }
                slider.children[0].children[clickedItemNumber].classList.add("active");
                sliderControls[clickedItemNumber].classList.add("active");
            }
        }, false);
    }

    let sliderProblems = document.querySelectorAll(".js-problems-slider-groups");
    let sliderProblemsDots = document.querySelectorAll(".js-problems-groups-dots");
    let sliderProblemsSlider = new Array();
    if (sliderProblems.length > 0) {
        for (i = 0; i < sliderProblems.length; i++) {
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

    let sliderCases = document.querySelectorAll(".js-cases-slider-groups");
    let sliderCasesLeftArrow = document.querySelectorAll(".js-cases-groups-arrows-left");
    let sliderCasesRightArrow = document.querySelectorAll(".js-cases-groups-arrows-right");
    let sliderCasesSlider = new Array();
    if (sliderCases.length > 0) {
        for (i = 0; i < sliderCases.length; i++) {
            sliderCasesSlider[i] = tns({
                container: sliderCases[i],
                items: 1,
                nav: false,
                prevButton: sliderCasesLeftArrow[i],
                nextButton: sliderCasesRightArrow[i],
                mouseDrag: true,
                slideBy: 'page'
            });
        }
    }

    // слайдер со статьями
    if (document.querySelectorAll(".js-project-article").length > 0) {
        tns({
            container: '.js-project-article',
            items: 1,
            controls: false,
            navPosition: 'bottom',
            navContainer: '.js-project-article-dots',
            mouseDrag: true,
            slideBy: 'page'
        });
    }

    // слайдер featured на странице блог
    if (document.querySelectorAll(".js-featured-news").length > 0) {
        tns({
            container: '.js-featured-news .news__list',
            items: 1.3,
            gutter: 32,
            edgePadding: 32,
            responsive: {
                768: {
                    items: 1.7
                },
                1100: {
                    items: 2.8
                },
                1440: {
                    edgePadding: 0,
                    items: 3,
                    nav: false
                }
            },
            nav: true,
            navPosition: 'bottom',
            controls: false,
            mouseDrag: true,
            slideBy: 'page'
        });
    }

    // слайдер "еще почитать"
    if (document.querySelectorAll(".js-more-news").length > 0) {
        tns({
            container: '.js-more-news .news__items',
            items: 1.3,
            gutter: 32,
            edgePadding: 20,
            responsive: {
                550: {
                    edgePadding: 0,
                    items: 2
                },
                1000: {
                    items: 3
                },
                1440: {
                    items: 4,
                    nav: false
                }
            },
            nav: true,
            navPosition: 'bottom',
            controls: false,
            mouseDrag: true,
            slideBy: 'page'
        });
    }

    // слайдер "на этом проекте мы сделали"
    if (document.querySelectorAll(".js-we-did").length > 0) {
        let container = document.querySelector(".js-we-did");

        if (windowWidth > 650) {
            tns({
                container: '.js-we-did',
                items: 4,
                gutter: 15,
                responsive: {
                    320: {
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
        else {
            tns({
                container: '.js-we-did',
                items: 4,
                gutter: 15,
                responsive: {
                    320: {
                        items: 2
                    },
                    992: {
                        items: 4
                    }
                },
                axis: "vertical",
                controls: false,
                navPosition: 'bottom',
                mouseDrag: true,
                slideBy: 'page'
            });
        }
    }

    // блок с кейсами
    if (document.querySelectorAll(".js-cases-container").length > 0) {
        let container = document.querySelector(".js-cases-container");
        let cases = Array.prototype.slice.call(container.children);

        let block = new Array();
        let curBlock = 0;
        let count = 1;
        let limit = 4;

        let sliderContainer = document.createElement("div");
        sliderContainer.className = "cases-container__inner js-cases-container-inner";
        container.appendChild(sliderContainer);

        for (i = 0; i < cases.length; i++) {
            if (cases[i].classList.contains("cases__case")) {
                if (count == 1) {
                    curBlock++;
                    block[curBlock] = document.createElement("div");
                    block[curBlock].className = "cases__block";
                    sliderContainer.appendChild(block[curBlock]);
                }
                if (cases[i].classList.contains("cases__case_double") && (count <= limit - 1)) {
                    block[curBlock].insertAdjacentElement('beforeEnd', cases[i]);
                    count++;
                }
                else if ((!cases[i].classList.contains("cases__case_double")) && (count <= limit)) {
                    block[curBlock].insertAdjacentElement('beforeEnd', cases[i]);
                }
                count++;
                if (count > limit)
                    count = 1;
            }
        }
        if (windowWidth <= 650) {
            tns({
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
        else {
            tns({
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

    // слайдер values на странице вакансии ver.2
    let valuesBlocks = document.querySelectorAll('.js-values');
    if (valuesBlocks.length > 0 && windowWidth <= 700) {
        for (i = 0; i < valuesBlocks.length; i++) {
            tns({
                container: valuesBlocks[i],
                items: 1.5,
                responsive: {
                    320: {
                        gutter: 20
                    },
                    481: {
                        gutter: 30
                    }
                },
                edgePadding: 30,
                nav: false,
                controls: false,
                mouseDrag: true,
                slideBy: 'page'
            });
        }
    }



    // фильтр на странице портфолио
    let portfolioBlocks = document.querySelectorAll(".js-cases-container-portfolio .container_portfolio-inner");
    let portfolioTypes = document.querySelectorAll(".js-cases-types");
    let portfolioTags = document.querySelectorAll(".js-cases-tags");

    if (portfolioBlocks.length > 0) {
        let curLimit = document.querySelectorAll(".js-cases-container-portfolio")[0].dataset.limit * 1;
        let moreButton = document.querySelectorAll(".js-cases-more")[0];
        moreButton.addEventListener("click", function (e) {
            e.preventDefault();
            curLimit += 4;
            portfolioRefresh(curLimit);
        })
        portfolioRefresh(curLimit);

        for (i = 0; i < portfolioTypes.length; i++) {
            let types = new Array();
            for (j = 0; j < portfolioBlocks[0].children.length; j++) {
                let typeString = portfolioBlocks[0].children[j].dataset.types.slice(1, portfolioBlocks[0].children[j].dataset.types.length - 1);
                types[j] = typeString.split(",");
            }

            portfolioTypes[i].addEventListener("click", function (e) {
                let options = e.target.parentNode.parentNode.childNodes[1];
                e.preventDefault();
                let selectedType = options?.selectedOptions[0]?.value;
                for (j = 0; j < types.length; j++) {
                    if (!types[j].includes("'" + selectedType + "'")) {
                        portfolioBlocks[0].children[j].classList.add("hide");
                    }
                    else {
                        portfolioBlocks[0].children[j].classList.remove("hide");
                    }
                }

                // refresh portfolioTags 
                for (j = 0; j < portfolioTags[0].children.length; j++) {
                    portfolioTags[0].children[j].classList.remove("active");
                }
                portfolioTags[0].children[0].classList.add("active");
                //--
                // for (j=0; j<types.length; j++){
                //     portfolioBlocks[0].children[j].classList.add("hide");
                // }
                portfolioRefresh(curLimit);
            })
        }
        for (i = 0; i < portfolioTags.length; i++) {
            let tags = new Array();
            for (j = 0; j < portfolioBlocks[0].children.length; j++) {
                let tagString = portfolioBlocks[0].children[j].dataset.cats.slice(1, portfolioBlocks[0].children[j].dataset.cats.length - 1);
                tags[j] = tagString.split(",");
            }

            portfolioTags[i].addEventListener("click", function (e) {
                e.preventDefault();
                let selectedTag;
                if (e.target.getAttribute("href") != null) {
                    selectedTag = e.target.getAttribute("href").slice(1);
                    for (j = 0; j < portfolioTags[0].children.length; j++) {
                        portfolioTags[0].children[j].classList.remove("active");
                    }
                    e.target.classList.add("active");
                    for (j = 0; j < tags.length; j++) {
                        if (!tags[j].includes("'" + selectedTag + "'")) {
                            portfolioBlocks[0].children[j].classList.add("hide");
                        }
                        else {
                            portfolioBlocks[0].children[j].classList.remove("hide");
                        }
                    }

                    // refresh portfolioTypes 
                    const el = portfolioTypes[0].parentNode.childNodes[1].querySelector('.select-items');
                    if (el) {
                        for (let one = 0; one < el.childNodes.length; one++) {
                            el.childNodes[one].classList.remove('same-as-selected');
                        }
                        el.childNodes[0].classList.add('same-as-selected');
                    }
                    //--
                    portfolioRefresh(curLimit);
                }
            })
        }
    }

    // генерация оглавления в блоге
    let editorial = document.querySelectorAll(".js-editorial");

    if (editorial.length > 0) {
        generateEditorialTOC(editorial[0]);
    }

    // генерация оглавления в кейсе
    let caseOuter = document.querySelector(".js-case-outer");
    if (caseOuter != undefined)
        generateCaseTOC(caseOuter);

    // фильтр на странице вакансий
    let vacanciesBlocks = document.querySelectorAll(".js-vacancies-container .vacancies__container_inner");
    let vacanciesTypes = document.querySelectorAll(".js-vacancies-types");

    if (vacanciesBlocks.length > 0) {
        let curLimit = document.querySelectorAll(".js-vacancies-container")[0].dataset.limit * 1;
        let moreButton = document.querySelectorAll(".js-vacancies-more")[0];
        const transitionButtons = document.querySelectorAll(".js-vacancies-page");
        if (vacanciesBlocks[0].children.length == 1){
            if (vacanciesBlocks[0].children[0].classList.contains("hide"))
                vacanciesBlocks[0].children[0].classList.remove("hide");
        }
        if (moreButton) {
            moreButton.addEventListener("click", function (e) {
                e.preventDefault();
                curLimit += 4;
                vacanciesRefresh(curLimit);
            })
        }
        if (windowWidth > 480) {
            vacanciesRefresh(curLimit);
        } else {
            curLimit = 3;
            vacanciesRefresh(curLimit);
            for (let one = 0; one < transitionButtons.length; one++) {
                transitionButtons[one].addEventListener("click", function (e) {
                    e.preventDefault();
                    vacanciesTransition(this.dataset.page, curLimit);
                    for (let two = 0; two < transitionButtons.length; two++) {
                        transitionButtons[two].parentNode.classList.remove('active')
                    }
                    this.parentNode.classList.add('active');
                })
            }
        }

        for (i = 0; i < vacanciesTypes.length; i++) {
            // создаем строку городов для пустой вакансии
            let types = new Array(),
                cities = new Array(),
                emptyVacancyCities = new Array()
            emptyVacancyData = "";

            for (j = 0; j < vacanciesBlocks[0].children.length; j++) {
                let typeString = vacanciesBlocks[0].children[j].dataset.types.slice(1, vacanciesBlocks[0].children[j].dataset.types.length - 1);
                types[j] = typeString.split(",");
            }

            for (j = 0; j < vacanciesTypes[0].children[0].children.length; j++) {
                cities.push(vacanciesTypes[0].children[0].children[j].value);
            }
            emptyVacancyCities = cities;

            for (j = 0; j < cities.length; j++) {
                let foundCity = false;
                for (k = 0; k < types.length; k++) {
                    if (types[k].includes("'" + cities[j] + "'")) {
                        foundCity = true;
                    }
                }
                if (foundCity) {
                    emptyVacancyCities.splice(j, 1);
                    j--;
                }
            }

            for (j = 0; j < emptyVacancyCities.length; j++) {
                emptyVacancyData += ",'" + emptyVacancyCities[j] + "'";
            }
            emptyVacancyData = "[" + emptyVacancyData.substring(1) + "]";
            document.getElementById("vac_send").dataset.types = emptyVacancyData;

            for (j = 0; j < vacanciesBlocks[0].children.length; j++) {
                let typeString = vacanciesBlocks[0].children[j].dataset.types.slice(1, vacanciesBlocks[0].children[j].dataset.types.length - 1);
                types[j] = typeString.split(",");
            }

            vacanciesTypes[i].addEventListener("click", function (e) {
                let options = e.target.parentNode.parentNode.childNodes[0];
                e.preventDefault();
                let selectedType = options.selectedOptions[0].value;
                for (j = 0; j < types.length; j++) {
                    if (!types[j].includes("'" + selectedType + "'")) {
                        vacanciesBlocks[0].children[j].classList.add("hide");
                    }
                    else {
                        vacanciesBlocks[0].children[j].classList.remove("hide");
                    }
                }
                vacanciesRefresh(curLimit);
            })
        }
    }
                
    // клик на фидбек на странице карьера
    let vacanciesList = document.querySelector(".vacancies__list");
    if (vacanciesList) {
        let activePositions = vacanciesList.querySelectorAll(".js-click-feedback");
        let targetInput = document.querySelector("[name='position']");
        const feedbackHead = document.querySelector("[name='feedback']");
        for (i = 0; i < activePositions.length; i++) {
            activePositions[i].addEventListener("click", function (e) {
                e.preventDefault();
                const positionTitle = new DOMParser().parseFromString(e.target.parentElement.previousElementSibling.querySelector(".vacancy__title_name").innerHTML, 'text/html').body.textContent;
                targetInput.value = positionTitle;
                if (feedbackHead) {
                    feedbackHead.scrollIntoView({
                        behavior: "smooth"
                    })
                }
            }, false);
        }
    }

    // фильтр новостей
    let newsBlocks = document.querySelectorAll(".js-news-grid-container");
    let newsTypes = document.querySelectorAll(".js-news-types");
    if (newsBlocks.length > 0) {
        for (let one = 0; one < newsBlocks.length; one++) {
            try {
                let curLimit = newsBlocks[one].dataset.limit * 1;
                let moreButton = document.querySelectorAll(".js-more")[0];
                const data = newsBlocks[one].dataset;
                if (!data.limitStable) {
                    moreButton?.addEventListener("click", function (e) {
                        //e.preventDefault();
                        curLimit += +data.perpage;
                        // containerRefresh(curLimit, newsBlocks, moreButton);
                        removeOverBlocks(newsBlocks[one], curLimit, data.limitStable, data, moreButton);
                    })
                }

                for (i = 0; i < newsTypes.length; i++) {
                    let types = new Array();
                    for (j = 0; j < newsBlocks[one].children.length; j++) {
                        let typeString = newsBlocks[one].children[j].dataset.tags.slice(1, newsBlocks[one].children[j].dataset.tags.length - 1);
                        types[j] = typeString.split(",");
                    }
                    removeOverBlocks(newsBlocks[one], data.limit, data.limitStable, data, moreButton);

                    newsTypes[i].addEventListener("click", function (e) {
                        curLimit = newsBlocks[one].dataset.limit * 1;
                        let options = e.target.parentNode.parentNode.childNodes[1];
                        e.preventDefault();
                        let selectedType = options?.selectedOptions[0]?.value;
                        let hiddenChilds = 0;
                        for (j = 0; j < types.length; j++) {
                            if (!types[j].includes("'" + selectedType + "'") && !types[j].includes("'every'")) {
                                newsBlocks[one]?.children[j]?.classList.add("hide");
                                hiddenChilds++;
                            }
                            else {
                                newsBlocks[one]?.children[j]?.classList.remove("hide");
                            }
                            // если установлен лимит скрываем овер блоки
                            removeOverBlocks(newsBlocks[one], data.limit, data.limitStable, data, moreButton);
                        }
                        // Проверить нужно ли скрыть блок в котором происходит фильтрация
                        if (newsBlocks[one]?.children?.length === hiddenChilds) {
                            newsBlocks[one].classList.add("hide")
                        } else {
                            newsBlocks[one].classList.remove("hide")
                        }
                        //--
                        // for (j=0; j<types.length; j++){
                        //     newsBlocks[one].children[j].classList.add("hide");
                        // }
                        // portfolioRefresh(curLimit);
                    })
                }
            } catch (err) {
                console.error({ err })
            }
        }
    }


    // блок вакансий
    let vacancyBlocks = document.querySelectorAll(".vacancy");
    if (vacancyBlocks.length) {
        if (windowWidth > 480) {
            for (i = 0; i < vacancyBlocks.length; i++) {
                vacancyBlocks[i].addEventListener("mouseover", function (e) {
                    e.preventDefault();
                    let vacancyContainer = this.children[0]; // контейнер с вакансией
                    let vacancyContainerHeight = vacancyContainer.getBoundingClientRect().height;
                    let vacancyName = vacancyContainer.getElementsByClassName("vacancy__title_name")[0];
                    let vacanceNameHeight = vacancyName.getBoundingClientRect().height + 100;
                    let vacancyTitle = vacancyName.parentNode;
                    let vacancyBody = vacancyTitle.nextElementSibling;
                    let sendAdjust = 0;
                    if (this.classList.contains("vacancy_send"))
                        sendAdjust = 120;
                    getup = -55;
                    vacancyTitle.style.top = getup - sendAdjust + vacanceNameHeight - vacancyContainerHeight + "px";
                    vacancyBody.style.top = getup - sendAdjust + vacanceNameHeight - vacancyContainerHeight + "px";
                    vacancyBody.style.height = -getup + sendAdjust + vacancyContainerHeight - vacanceNameHeight + 92 + "px";
                }, false);
                vacancyBlocks[i].addEventListener("mouseout", function (e) {
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
        else {
            for (i = 0; i < vacancyBlocks.length; i++) {
                vacancyBlocks[i].addEventListener("click", function (e) {
                    if (e.target.className === 'vacancy__body_link') {
                        return;
                    }
                    e.preventDefault();
                    let vacancyContainer = this.children[0]; // контейнер с вакансией
                    let vacancyName = vacancyContainer.getElementsByClassName("vacancy__title_name")[0];
                    let vacancyTitle = vacancyName.parentNode;
                    const icon = vacancyTitle.children[0];
                    if (this.style.height === "336px") {
                        this.style.height = "188px";
                        vacancyContainer.style.height = "100%";
                        this.style.maxHeight = "188px";
                        vacancyContainer.style.maxHeight = "100%";
                        icon.style.transform = "rotate(0deg)";
                        if (this.id === 'vac_send') {
                            this.style['padding-bottom'] = "128px";
                        }
                    } else {
                        this.style.height = "336px";
                        vacancyContainer.style.height = "100%";
                        this.style.maxHeight = "336px";
                        vacancyContainer.style.maxHeight = "100%";
                        icon.style.transform = "rotate(135deg)";
                        if (this.id === 'vac_send') {
                            this.style['padding-bottom'] = "336px";
                        }
                    }
                }, false);
            }
        }
    }

    // выпадающее меню
    let pmenuToggler = document.querySelector(".js-top-menu");
    let pmenuTogglerInner = document.querySelector(".js-top-menu-inner");
    let pmenuBody = document.querySelector(".pmenu");
    pmenuToggler.addEventListener("click", function (e) {
        e.preventDefault();
        if (pmenuBody.classList.contains("active")) {
            pmenuBody.classList.remove("active");
            pmenuToggler.parentNode.classList.remove("active");
            document.querySelector("body").classList.remove("popup-open");
        }
        else {
            pmenuBody.classList.add("active");
            pmenuToggler.parentNode.classList.add("active");
            document.querySelector("body").classList.add("popup-open");
        }
    }, false);
    pmenuTogglerInner.addEventListener("click", function (e) {
        e.preventDefault();
        if (pmenuBody.classList.contains("active")) {
            pmenuBody.classList.remove("active");
            pmenuToggler.parentNode.classList.remove("active");
            document.querySelector("body").classList.remove("popup-open");
        }
    }, false);

    // выпадающее оглавление в новостях
    let tocToggler = document.querySelector(".js-sidetoc");
    let tocBody = document.querySelector(".editorial-container__toc-inner");
    let tocContainer = document.querySelector(".js-toc");
    if (tocToggler != null && tocBody != null) {
        tocToggler.addEventListener("click", function (e) {
            e.preventDefault();

            let frames = 3;

            if (tocBody.classList.contains("hide")) {
                //tocBody.classList.add("fixed");
                //tocContainer.classList.add("fixed");
                tocBody.classList.remove("hide");
                let TOCHeight = 0;
                if (document.getElementsByClassName('editorial-container__toc-inner')[0] != undefined)
                    TOCHeight = document.getElementsByClassName('editorial-container__toc-inner')[0].getBoundingClientRect().height;
                document.getElementsByClassName('js-toc')[0].style.height = TOCHeight + 68 + "px";
                let frame = 1;
                let animation = setInterval(function () {
                    if (frame > frames) { clearInterval(animation); return; }
                    tocToggler.style.backgroundImage = 'url(/assets/css/img/icon-editorial' + frame + '.svg)';
                    frame++;
                }, 60);
            }
            else {
                tocBody.classList.add("hide");
                tocBody.classList.remove("fixed");
                //tocContainer.classList.remove("fixed");
                document.getElementsByClassName('js-toc')[0].style.height = 68 + "px";
                let frame = 3;
                let animation = setInterval(function () {
                    if (frame < 1) { clearInterval(animation); return; }
                    tocToggler.style.backgroundImage = 'url(/assets/css/img/icon-editorial' + frame + '.svg)';
                    frame--;
                }, 60);
            }
        }, false);
    }

    // упрощенный ток - скролл по ссылкам

    let scrollNavigationContainer = document.querySelector(".js-scroll-navigation");
    if (scrollNavigationContainer) {
        const stickyTOC = document.getElementsByClassName('case-container__toc-inner')[0];
        const editorialTop = document.getElementsByClassName('js-scrollsection-1')[0]?.getBoundingClientRect().height;
        const wWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        // const wHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
        //stickyTOC.style.height = 400 + "px";

        const lev1Sel = scrollNavigationContainer.querySelectorAll(".case-container__toc-lev1");
        // let editorialTop = document.getElementsByClassName('header')[0].getBoundingClientRect().height + document.getElementsByClassName('top_news')[0].getBoundingClientRect().height;
        function simplifiedToc() {
            bodyScrollTop = document.documentElement.scrollTop || document.body.scrollTop;
            //let TOCHeight = document.getElementsByClassName('js-scrollsection-1')[0]?.getBoundingClientRect().height;
            //stickyTOC.style.height = TOCHeight + "px";
            let contentTop = document.getElementsByClassName('header')[0].getBoundingClientRect().height +
                        document.getElementsByClassName('services-v2')[0].getBoundingClientRect().height +
                        document.getElementsByClassName('services-v2')[1].getBoundingClientRect().height + 80;
            
            if (bodyScrollTop > editorialTop) {
                // document.getElementsByClassName('case-container__toc-inner')[0].classList.add('fixed');
                stickyTOC.classList.add('fixed');
                if (wWidth > 1024 && document.getElementsByClassName('js-scrollsection-1')[0] != undefined) {
                    if (bodyScrollTop > editorialTop + document.getElementsByClassName('js-scrollsection-1')[0].getBoundingClientRect().height)
                        document.getElementsByClassName('js-scrollsection-1')[0]?.classList.add('floored');
                    else
                        document.getElementsByClassName('js-scrollsection-1')[0]?.classList.remove('floored');
                }

                const scrollsection1 = document.getElementsByClassName('js-scrollsection-1')[0].offsetTop;
                const scrollsection2 = document.getElementsByClassName('js-scrollsection-2')[0].offsetTop;
                const scrollsection3 = document.getElementsByClassName('js-scrollsection-3')[0].offsetTop;
                const scrollsection4 = document.getElementsByClassName('js-scrollsection-4')[0].offsetTop;

                if(bodyScrollTop > scrollsection4 - 50) {
                    Array.from(lev1Sel).forEach((one) => {
                        one.classList.remove("active")
                    })
                    lev1Sel[3].classList.add("active")
                } else if(bodyScrollTop > scrollsection3 - 50) {
                    Array.from(lev1Sel).forEach((one) => {
                        one.classList.remove("active")
                    })
                    lev1Sel[2].classList.add("active")
                } else if(bodyScrollTop > scrollsection2 - 50) {
                    Array.from(lev1Sel).forEach((one) => {
                        one.classList.remove("active")
                    })
                    lev1Sel[1].classList.add("active")
                } else if(bodyScrollTop > scrollsection1 - 50) {
                    Array.from(lev1Sel).forEach((one) => {
                        one.classList.remove("active")
                    })
                    lev1Sel[0].classList.add("active")
                }
                stickyTOC.style.top =  "";
            }

            else {
                document.getElementsByClassName('case-container__toc-inner')[0]?.classList.remove('fixed');
                stickyTOC.classList.remove('fixed');
                stickyTOC.style.top = contentTop + "px";
            }

            // if (allHeadings.length) {
            //     let activeHeading = -1;
            //     for (i = 0; i < allHeadings.length; i++) {
            //         if (bodyScrollTop > (allHeadings[i].getBoundingClientRect().top + window.scrollY - wHeight)) {
            //             activeHeading = i;
            //         }
            //     }
            //     Array.prototype.slice.call(allHeadings).forEach(function (heading, index) {
            //         if (index == activeHeading) {
            //             allTOCHeadings[index].classList.add('active');
            //         }
            //         else {
            //             allTOCHeadings[index].classList.remove('active');
            //         }
            //     });
            // }
            // else {
            //     Array.prototype.slice.call(allHeadings).forEach(function (heading, index) {
            //         allTOCHeadings[index].classList.remove('active');
            //     });
            // }
        }
        simplifiedToc();
        window.addEventListener('touch', simplifiedToc, true);
        window.addEventListener('scroll', simplifiedToc, true);
        window.addEventListener('resize', simplifiedToc, true);

        Array.from(lev1Sel).forEach((one, indexLv1) => one.addEventListener("click", (e) => {
            if (one.classList.contains("active")) {
                return;
            } else {
                Array.from(lev1Sel).forEach((one) => one.classList.remove("active"));
                one.classList.add("active");
                scrollsel = document.querySelectorAll(".js-scrollsection-" + (one.dataset.scrollTab));
                if (scrollsel && scrollsel[0]) {
                    scrollsel[0].scrollIntoView({
                        behavior: "smooth"
                    })
                }
                const lev2Sel = one.querySelectorAll(".case-container__toc-lev2 .js-scrollto");
                Array.from(lev2Sel).forEach(three => {
                    three.classList.remove("active")
                })
                Array.from(lev2Sel)[0].classList.add("active")
            }
        }))

        Array.from(lev1Sel).forEach((one, indexLv1) => {
            const lev2Sel = one.querySelectorAll(".case-container__toc-lev2 .js-scrollto");
            const scrollsel = document.querySelectorAll(".js-scrollsection-" + (one.dataset.scrollTab));
            Array.from(lev2Sel).forEach((two, indexLv2) => two.addEventListener("click", (e) => {
                e.stopPropagation()
                const links = scrollsel[0].querySelectorAll(".js-accordion-link");
                if (links) {
                    const linkto = Array.from(links).find(one => one.dataset.accordionLink === "" + (indexLv2 + 1));
                    if (linkto) {
                        linkto.scrollIntoView({
                            behavior: "smooth"
                        })
                        if (!linkto.classList.contains('active')) {
                            Array.from(links).forEach(link => {
                                link.classList.remove('active')
                            });
                            linkto.click()
                        }
                    }
                }
                Array.from(lev2Sel).forEach(three => {
                    three.classList.remove("active")
                })
                two.classList.add("active")
            }))
        })
        // Array.from(lev1Sel).forEach((one, indexLv1) => {
        //     const lev2Sel = one.querySelectorAll(".case-container__toc-lev2 .js-scrollto");
        //     const scrollsel = document.querySelectorAll(".js-scrollsection-" + (one.dataset.scrollTab));
        //     Array.from(lev2Sel).forEach((two, indexLv2) => two.addEventListener("click", (e) => {
        //         e.stopPropagation()
        //         const links = scrollsel[0].querySelectorAll(".js-accordion-tab");
        //         console.log({links})
        //         if (links) {
        //             const linkto = Array.from(links).find(one => 
        //                 {
        //                     console.log(one.dataset.accordionTab)
        //                     console.log("" + (indexLv2 + 1))
        //                     return one.dataset.accordionTab === "" + (indexLv2 + 1)
        //                 });
        //             if (linkto) {
        //                 linkto.scrollIntoView({
        //                     behavior: "smooth"
        //                 })
        //                 if (!linkto.classList.contains('active')) {
        //                     Array.from(links).forEach(link => {
        //                         link.classList.remove('active')
        //                     });
        //                     linkto.classList.add("active")
        //                     // linkto.click()
        //                 }
        //             }
        //             console.log({ linkto })
        //         }
        //     }))
        // })
        // "case-container__toc-lev1 active";
        // "js-scrollsection-1";

        document.addEventListener('click', function (e) {
            if (e.target.classList.contains('js-sidetoc')) {
                e.preventDefault();
                if (e.target.classList.contains('closed')) {
                    e.target.classList.remove('closed');
                    e.target.parentElement.classList.remove('closed');
                }
                else {
                    e.target.classList.add('closed');
                    e.target.parentElement.classList.add('closed');
                }
            }
        }, true);
    }


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
    if (textarea.length) {
        for (let i = 0; i < textarea.length; i++) {
            textarea[i].setAttribute("style", "height:" + (textarea[i].scrollHeight) + "px;overflow-y:hidden;");
            textarea[i].addEventListener("input", TextareaOnInput, false);
            if (windowWidth < 500) {
                if (textarea[i].id == 'project_desc') {
                    textarea[i].placeholder = 'Краткая информация'
                }
            }
        }
    }

    // слайдер типа range
    const range = document.querySelector(".range");
    if (range != null) {
        document.querySelector(".range").classList.add('js');

        let outVal = document.createElement("input");
        outVal.setAttribute('id', 'range');
        outVal.setAttribute('name', 'range');
        outVal.setAttribute('type', 'hidden');
        range.appendChild(outVal);

        function rangeMonitor(e) {
            let _t;
            if (e == undefined) _t = document.querySelectorAll('.range input[type="range"]')[0];
            else _t = _t = e.target;
            let _p = _t.parentNode,
                val = +_t.value,
                _o = _p.querySelector(`option[value='${val}']`),
                lbl = +_o.label;
            let wwidth = (window.innerWidth > 0) ? window.innerWidth : screen.width;
            // margins for container
            let _rangeContainer = _p.parentNode;
            let containerMargin;
            if (wwidth <= 1500) {
                if (wwidth > 650) containerMargin = 0.055 * wwidth + 48.5;
                else if (wwidth > 570) containerMargin = 0.1013 * wwidth + 50.155;
                else containerMargin = 0.0435 * wwidth + 19.5;
                if (containerMargin != undefined) {
                    _rangeContainer.style.marginLeft = -containerMargin + 'px';
                    _rangeContainer.style.marginRight = -containerMargin + 'px';
                }
            }

            //let wdd = wwidth > 1500 ? _p.clientWidth : (wwidth > 650 ? wwidth : wwidth - 60);
            //let wdd = wwidth > 650 ? _p.clientWidth : wwidth - 60;
            let wdd = wwidth > 650 ? _p.clientWidth : _p.clientWidth - 60;

            _t.setAttribute('aria-valuetext', lbl);
            _p.style.setProperty(`--${_t.id}`, val);
            _p.style.setProperty(`--lbl-${_t.id}`, lbl + "");
            _p.style.setProperty(`--wd`, wdd); // 60 - padding
            let aVal = document.getElementById('l').children[document.getElementById('a').value].getAttribute('label');
            let bVal = document.getElementById('l').children[document.getElementById('b').value].getAttribute('label');
            outVal.setAttribute('value', '' + aVal + '-' + bVal + ' млн');
        }

        document.querySelectorAll('.range input[type="range"]')[0].addEventListener('input', rangeMonitor, false);
        document.querySelectorAll('.range input[type="range"]')[1].addEventListener('input', rangeMonitor, false);
        rangeMonitor();
    }

    // выпадающее видео
    let videoOpener = document.querySelector(".js-popup-video-open");
    let videoCloser = document.querySelector(".js-popup-video-close");
    let videoBody = document.querySelector(".popup-video");
    if (videoOpener != null) {
        videoOpener.addEventListener("click", function (e) {
            e.preventDefault();
            videoBody.classList.add("active");
            document.querySelector("body").classList.add("popup-open");
        }, false);
        videoCloser.addEventListener("click", function (e) {
            e.preventDefault();
            videoBody.classList.remove("active");
            document.querySelector("body").classList.remove("popup-open");
        }, false);
    }

    // выпадающая форма обратной связи
    let feedbackOpener = document.querySelectorAll(".js-popup-feedback-open");
    let feedbackCloser = document.querySelector(".js-popup-feedback-close");
    /*
    let feedbackSubmiter = document.querySelector(".js-popup-feedback-send");
    let feedbackSubmiterApplicants = document.querySelector(".js-popup-feedback-send-applicants");
    let bodyOpened;
    if(feedbackSubmiterApplicants) {
        let feedbackBody = document.querySelector(".popup-feedback");
        let feedbackBodyContent = document.querySelector(".popup-feedback__content");
        feedbackSubmiterApplicants.addEventListener("click", function(e){
            feedbackBody.classList.add("active");
            feedbackBodyContent.classList.add("popup-feedback__content_success");
        });
        setTimeout(function(){
            feedbackBody.classList.remove("active");
            document.querySelector("body").classList.remove("popup-open");
            feedbackBodyContent.classList.remove("popup-feedback__content_success");
        }, 40000);

    } else if(!feedbackOpener.length && feedbackSubmiter) {
        let feedbackBody = document.querySelector(".popup-feedback");
        let feedbackBodyContent = document.querySelector(".popup-feedback__content");
        feedbackSubmiter.addEventListener("click", function(e){
            feedbackBody.classList.add("active");
            feedbackBodyContent.classList.add("popup-feedback__content_success");
        });
        setTimeout(function(){
            feedbackBody.classList.remove("active");
            document.querySelector("body").classList.remove("popup-open");
            feedbackBodyContent.classList.remove("popup-feedback__content_success");
        }, 40000);
    }
    */
    for (i = 0; i < feedbackOpener.length; i++) {
        let feedbackBody = document.querySelector(".popup-feedback");
        let feedbackBodyContent = document.querySelector(".popup-feedback__content");
        if (feedbackOpener[i] != null) {
            feedbackOpener[i].addEventListener("click", function (e) {
                e.preventDefault();
                if (typeof ym === "function") {
                    ym(23767978, 'reachGoal', 'CLICKrequest');
                }
                if (windowWidth < 481 && e.target.className.startsWith('vacanc') && e.target.className !== 'vacancy__body_link') {
                    return;
                }
                feedbackBody.classList.add("active");
                document.querySelector("body").classList.add("popup-open");
                bodyOpened = document.querySelector(".popup-open");
                if (bodyOpened != null) {
                    bodyOpened.addEventListener("click", function (e) {
                        if (e.target.classList.contains("popup-feedback") || e.target.parentNode.classList.contains("popup-feedback")) {
                            feedbackBody.classList.remove("active");
                            document.querySelector("body").classList.remove("popup-open");
                        }
                    }, false);
                }
            }, false);
            if (feedbackCloser != null) {
                feedbackCloser.addEventListener("click", function (e) {
                    e.preventDefault();
                    if (feedbackBody != null) {
                        feedbackBody.classList.remove("active");
                    }
                    document.querySelector("body").classList.remove("popup-open");
                }, false);
            }
            document.addEventListener('ajaxFormResponse', (e) => {
                if (e.detail === true || e.details === false) {
                    if (feedbackBody != null) {
                        feedbackBody.classList.remove("active");
                    }
                    document.querySelector("body").classList.remove("popup-open");
                }
            }, false);

            // feedbackSubmiter.addEventListener("click", function(e){
            //     feedbackBodyContent.classList.add("popup-feedback__content_success");
            //     setTimeout(function(){
            //         feedbackBody.classList.remove("active");
            //         document.querySelector("body").classList.remove("popup-open");
            //         feedbackBodyContent.classList.remove("popup-feedback__content_success");
            //     }, 4000);
            // }, false);
        }
    }


    // круг с цифрами
    let circleContainer = document.querySelectorAll(".circle");

    for (j = 0; j < circleContainer.length; j++) {

        let circleText = circleContainer[j].querySelector(".circle-text");
        let circlePic = circleContainer[j].querySelector(".circle-pic");
        let circleAbout = circleContainer[j].querySelector(".circle-about") || document.querySelector(".about__animation_items");

        if (circlePic != null) {
            circlePic.classList.add("rotating");
            let num = 3;
            setInterval(function () {
                for (i = 0; i < circleText.children.length; i++) {
                    circleText.children[i % circleText.children.length].style.opacity = "0";
                }
                for (i = 0; i < circleAbout.children.length; i++) {
                    circleAbout.children[i % circleAbout.children.length].style.opacity = "0";
                }
                setTimeout(() => {
                    for (i = 0; i < circleText.children.length; i++) {
                        circleText.children[i % circleText.children.length].style.display = "none";
                    }
                    for (i = 0; i < circleAbout.children.length; i++) {
                        circleAbout.children[i % circleAbout.children.length].style.display = "none";
                    }
                }, 1000);
                setTimeout(() => {
                    circleText.children[num % circleText.children.length].style.opacity = "0";
                    circleText.children[num % circleText.children.length].style.display = "block";
                    circleAbout.children[num % circleAbout.children.length].style.opacity = "0";
                    circleAbout.children[num % circleAbout.children.length].style.display = "block";
                    setTimeout(() => {
                        circleText.children[num % circleText.children.length].style.opacity = "1";
                        circleAbout.children[num % circleAbout.children.length].style.opacity = "1";
                    }, 250);
                }, 1000);
                num++;
            }, 5000);
        }
    }

    if (document.querySelector('.js-map-container')) {
        new ContactMapYandex(document.querySelectorAll('.js-map-container'),
            document.querySelectorAll('.js-map-address'),
            document.querySelector('.js-map-select'));
    }

    // кастомный селект
    if (document.querySelector('.select')) {
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
            divCreated.innerHTML = selectsByTag?.options[selectsByTag.selectedIndex]?.innerHTML;

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

                if (j == 0) { div3Created.setAttribute("class", "same-as-selected"); }
                /*custom options*/
                if (selectsByTag.options[j].value == "ios" ||
                    selectsByTag.options[j].value == "android" ||
                    selectsByTag.options[j].value == "web" ||
                    selectsByTag.options[j].value == "other") {
                    newClass = "iconed_" + selectsByTag.options[j].value;
                    div3Created.classList.add("iconed");
                    div3Created.classList.add(newClass);
                }

                div3Created.addEventListener("click", function (e) {
                    function updateSelect(removed, change, eHTML, placeh) {
                        selectSelected = document.getElementsByClassName("select-selected");
                        let sll = selectSelected.length
                        const placeholder = placeh || 'Выберите';
                        for (let one = 0; one < sll; one++) {
                            if (eHTML == selectSelected[one].innerHTML) {
                                if (removed) {
                                    selectSelected[one].innerHTML = selectSelected[one].innerHTML.split(', ').filter(function (f) { return f !== removed }).join(', ');
                                    if (!selectSelected[one].innerHTML) {
                                        selectSelected[one].innerHTML = placeholder;
                                    }
                                } else {
                                    if (selectSelected[one].innerHTML != placeholder) {
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
                    let optionSelected, i, k, selectsByTagDiv3, pvsSibling, sl, yl, selectedName;
                    selectsByTagDiv3 = this.parentNode.parentNode.getElementsByTagName("select")[0];
                    const isMultiple = selectsByTagDiv3.id.startsWith('multiple')
                    sl = selectsByTagDiv3.length;
                    pvsSibling = this.parentNode.previousSibling;
                    for (i = 0; i < sl; i++) {
                        selectedName = selectsByTagDiv3.options[i].innerHTML;
                        if (selectedName == this.innerHTML) {
                            if (!isMultiple) {
                                selectsByTagDiv3.selectedIndex = i;
                            }
                            if (!isMultiple) {
                                pvsSibling.innerHTML = this.innerHTML
                            }
                            optionSelected = this.parentNode.getElementsByClassName("same-as-selected");
                            yl = optionSelected.length;
                            let removed = false;
                            // let removedInd = false;
                            selectsByTagDiv3.options[i].setAttribute('selected', '');
                            if (isMultiple) {
                                for (k = 0; k < yl; k++) {
                                    if (optionSelected[k]?.innerHTML == this.innerHTML) {
                                        removed = optionSelected[k]?.innerHTML; //  check why triggering error
                                        // removedInd = k; //  check why triggering error
                                        optionSelected[k]?.classList.remove("same-as-selected");
                                        selectsByTagDiv3.options[i].removeAttribute('selected');
                                    }
                                }
                            } else {
                                for (k = 0; k < yl; k++) {
                                    optionSelected[k].classList.remove("same-as-selected");
                                }
                                this.classList.add("same-as-selected");
                            }
                            if (isMultiple) {
                                if (!removed) {
                                    this.classList.add("same-as-selected");
                                }
                                const change = removed || this.innerHTML;
                                updateSelect(removed, change, pvsSibling.innerHTML, selectedName);
                            }
                            break;
                        }
                    }
                    if (!isMultiple) {
                        pvsSibling.click(); // ???
                    }
                });
                div2Created.appendChild(div3Created);
            }

            selectsByClass[i].appendChild(div2Created);
            divCreated.addEventListener("click", function (e) {
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
    if (portfolioBlocks.length > 0) {
        const url = new URL(window.location.href);
        const cT = url.searchParams?.get("casesTypes")
        if (cT) {
            const curLimit = document.querySelectorAll(".js-cases-container-portfolio")[0].dataset.limit * 1;
            const checked = ['all', 'start', 'scale', 'consult'];
            const ind = checked.indexOf(cT)
            if (~ind) {
                let options = portfolioTypes[0].parentNode.childNodes[1].childNodes[1];
                let selected = document.querySelectorAll('.same-as-selected')[0];
                selected.classList.remove('same-as-selected')
                selected.parentNode.childNodes[ind].classList.add('same-as-selected')
                options.value = cT;
                options.selectedOptions[0].value = cT;
                for (j = 0; j < checked.length; j++) {
                    if (!checked[j].includes("'" + cT + "'")) {
                        portfolioBlocks[0].children[j].classList.add("hide");
                    }
                    else {
                        portfolioBlocks[0].children[j].classList.remove("hide");
                    }
                }
                portfolioRefresh(curLimit);
            }
        }

    }

    // блок с фото сотрудников
    if (document.querySelectorAll(".js-team-container").length > 0) {
        // let container = document.querySelector(".js-team-container");
        tns({
            container: '.js-team-container .team__list',
            items: 4,
            gutter: 15,
            responsive: {
                320: {
                    items: 2
                },
                650: {
                    items: 3
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

    // блок с фото сотрудников
    if (document.querySelectorAll(".js-astra-team-container").length > 0) {
        // const container = document.querySelector(".js-astra-team-container");
        tns({
            container: '.js-astra-team-container .team__list',
            items: 4.5,
            gutter: 15,
            responsive: {
                320: {
                    items: 1.4
                },
                640: {
                    items: 2.4
                },
                992: {
                    items: 3.5
                },
                1315: {
                    items: 4
                },
                1420: {
                    items: 4.5
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
    if (document.querySelectorAll(".js-randomcases-container").length > 0) {
        if (document.querySelector('.some-projects__list')) {
            let container = document.querySelector(".js-randomcases-container");
            for (let i = 0; i < 4; i++) {
                let random = Math.floor(1 + Math.random() * container.children[0].childElementCount);
                let child = document.querySelector('.js-randomcases-container > .some-projects__list > .cases__case:nth-child(' + random + ')');
                // portfolio
                if (child)
                    child.remove();
            }
            // let cases = Array.prototype.slice.call(container.children[0].children);
            tns({
                container: '.js-randomcases-container .some-projects__list',
                items: 4,
                gutter: 15,
                responsive: {
                    320: {
                        items: 2,
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
    }

    if (document.querySelectorAll(".js-aurora-cases").length > 0) {
        if (document.querySelector('.some-projects__list')) {
            // let container = document.querySelector(".js-aurora-cases");
            // let cases = Array.prototype.slice.call(container.children[0].children);
            tns({
                container: '.js-aurora-cases .some-projects__list',
                items: 1,
                gutter: 15,
                responsive: {
                    768: {
                        items: 2,
                        nav: false
                    }
                },
                controls: false,
                nav: true,
                navPosition: 'bottom',
                mouseDrag: true,
                slideBy: 'page'
            });
        }
    }

    // аккордеон
    if (document.querySelectorAll(".js-accordion").length > 0) {
        let container = document.querySelector(".js-accordion");
        let accItems = Array.prototype.slice.call(container.children);
        for (i = 0; i < accItems.length; i++) {
            accItems[i].addEventListener("click", function (e) {
                if (e.target.className.startsWith('project') || e.target.className.startsWith('cases')) {
                    return;
                }
                e.preventDefault();
                e.target.parentNode.classList.toggle("active");
            }, false);
        }
    }

    // блок с годами
    if (document.querySelectorAll(".js-years").length > 0) {
        // let container = document.querySelector(".js-years");

        // let cases = Array.prototype.slice.call(container.children[0].children);

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
            let num = info.displayIndex - 1;
            //let data = switcherItems[clickedIndex].dataset;

            const bullet = document.querySelector(".js-year-circle");
            const yearnum = document.querySelector(".js-year-number");
            bullet.style.left = 100 * num / (info.slideCount - 1) + "%";
            yearnum.innerHTML = info.slideItems[info.displayIndex].dataset.year;

        });

        slideCircle();
        sliderYears.events.on('transitionEnd', slideCircle);
    }

    // кнопка submit данных на странице request
    if (document.querySelectorAll(".js-request-button").length > 0) {
        // document.getElementById('phonefield').addEventListener('input', function (e) {
        //     var x = e.target.value.replace(/\D/g, '').match(/(\d{0,3})(\d{0,3})(\d{0,4})/);
        //     e.target.value = (!x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : ''));
        // });

        const btn = document.querySelectorAll(".js-request-button")[0];
        let form = document.getElementById('request__form');
        btn.onclick = function () {
            let fields = form.getElementsByTagName('input')
            let one;
            let scrolled = false;
            for (one = 0; one < fields.length; one++) {
                if (!checkFieldValid(fields[one])) {
                    if (!scrolled) {
                        scrolled = true;
                        // fields[one].scrollIntoView({
                        //     behavior: "smooth"
                        // })
                        form.scrollIntoView({
                            behavior: "smooth"
                        })
                    }
                    fields[one].classList.add("error");
                }
            }
            if (typeof ym === "function") {
                ym(23767978, 'reachGoal', 'CLICKsend');
            }
        }
    }

    if (document.querySelectorAll(".js-request-animate").length > 0) {
        const btns = document.querySelectorAll(".js-request-animate");
        for (i=0; i < btns.length; i++){
            btns[i].onclick = function (e) {
                let btn = this;
                btn.classList.add('clicked');
                setTimeout(function(){btn.classList.remove('clicked');}, 5000);
            }
        }
    }

    // функциональность чекбокса согласия с политиками
    if (document.querySelector('.js-request-agreed')) {
        const conts = document.querySelectorAll('.js-request-agreed');
        const btn = conts[conts.length-1].nextElementSibling.querySelector('.button');
        conts.forEach(function (cont, index) {
            const chk = document.querySelector('#agreed'+index);
            cont.onclick = function (e) {
                let checkedCheckboxes = document.querySelectorAll('.js-request-agreed input[type="checkbox"]:checked');
                if (conts.length != checkedCheckboxes.length) btn.setAttribute('disabled', 'disabled');
                else btn.removeAttribute('disabled');
            }
        });
    }

    const scrolltoapplicants = document.querySelectorAll(".js-scrollto-applicants-form");
    if (scrolltoapplicants.length > 0) {
        for (i = 0; i < scrolltoapplicants.length; i++) {
            scrolltoapplicants[i].addEventListener("click", function (e) {
                let feedback_applicants = document.getElementsByClassName('feedback_applicants');
                if (feedback_applicants.length) {
                    feedback_applicants[0].scrollIntoView({
                        behavior: "smooth"
                    })
                }
            }, false);
        }
    }

    //переключение категорий на главной странице
    if (document.querySelectorAll(".js-switch-category").length > 0) {
        const categorySwitchers = document.querySelectorAll(".js-switch-category a, .js-switch-category span");
        const businessBlocks = document.querySelectorAll(".js-show-business");
        const applicantsBlocks = document.querySelectorAll(".js-show-applicants");
        for (i = 0; i < categorySwitchers.length; i++) {
            categorySwitchers[i].addEventListener("click", function (e) {
                e.preventDefault();
                for (j = 0; j < businessBlocks.length; j++) businessBlocks[j].classList.toggle("hide");
                for (j = 0; j < applicantsBlocks.length; j++) applicantsBlocks[j].classList.toggle("hide");
            }, false);
        }
    }

    if (windowWidth < 1025) {
        const astralinuxCardsClick = document.querySelectorAll(".astralinux-container-interactive .content-container .content-card");
        if (astralinuxCardsClick.length > 0) {
            for (i = 0; i < astralinuxCardsClick.length; i++) {
                const card = astralinuxCardsClick[i];
                card.addEventListener("click", function () {
                    card.classList.contains("content-card-active") ?
                        card.classList.remove("content-card-active") :
                        card.classList.add("content-card-active")
                }, false);
            }
        }
    }

    //  astralinux highlighting cards by scroll
    // if (windowWidth > 480) {
    const activeContainer = document.querySelectorAll(".js-active-contents-by-scroll");
    if (activeContainer?.length) {
        const cards = activeContainer[0].querySelectorAll(".content-card")
        const coords = [];
        const heights = [];
        for (let one = 0; one < cards.length; one++) {
            coords.push(cards[one].offsetTop)
            heights.push(cards[one].clientHeight)
        }
        if (activeContainer.length > 0) {
            let centerOfScreen = 0;
            let ticking = false;
            let cleared = true;
            const heightConstant = 150;
            document.addEventListener("scroll", debounce(() => {
                centerOfScreen = window.scrollY + (window.innerHeight / 2) - heightConstant;
                if (centerOfScreen > activeContainer[0].offsetTop && centerOfScreen < activeContainer[0].nextElementSibling.offsetTop) {
                    const closestCardOffsetY = coords.reduce(function (prev, curr) {
                        return (Math.abs(curr - centerOfScreen) < Math.abs(prev - centerOfScreen) ? curr : prev);
                    });
                    if (!ticking) {
                        window.requestAnimationFrame(() => {
                            ticking = false;
                            const closestCardIndex = coords.findIndex(one => one === closestCardOffsetY);
                            // reset styles
                            for (let one = 0; one < cards.length; one++) {
                                if (one !== closestCardIndex) {
                                    cards[one].classList.contains("content-card-closest-active") ?
                                        cards[one].classList.remove("content-card-closest-active") :
                                        null
                                } else {
                                    cards[closestCardIndex].classList.contains("content-card-closest-active") ? null :
                                        cards[closestCardIndex].classList.add("content-card-closest-active")
                                }
                            }
                            cleared = false;
                        });
                        ticking = true;
                    }
                } else if (!cleared) {
                    for (let one = 0; one < cards.length; one++) {
                        cards[one].classList.contains("content-card-closest-active") ?
                            cards[one].classList.remove("content-card-closest-active") :
                            null
                    }
                    cleared = true;
                }
            }, 100));
        }
    }
    // }

    // redesign
    if (document.querySelectorAll(".js-tag-categories-container").length > 0) {
        const tagFilters = document.querySelectorAll(".tags-filters .tags-filters__container .filters-wrapper .filter-tag");
        let activeType = "all";
        // let limit = 4;
        const tagsGroups = {
            consulting: [
                "edtech",
                "retail",
                "real_estate",
                "sports",
                "clear"
            ],
            development: [
                "social_networks",
                "retail",
                "fintech",
                "medtech",
                "wearable",
                "telecom",
                "landing",
                "IT",
                "real_estate",
                "clear"
            ]
        }
        const classToClick = [
            "tags-category",
            "tags__categories",
            "tags-filters",
            "filter-tag",
            "filters-wrapper",
        ]
        const activeFilters = new Map();
        const idToToggle = "tags-filters";
        const elemToToggle = document.getElementById(idToToggle);
        const classToToggle = "opacity-0";
        // const classToToggle = "hidden";
        const tagCatsContainer = document.querySelectorAll(".js-tag-categories-container")[0];
        const tagActives = document.querySelectorAll(".tags__selected .tag-active");
        const publications = document.querySelectorAll(".js-tag-publications .card");

        Array.from(tagCatsContainer.children).forEach((one, index) => one.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleClass(elemToToggle, classToToggle, false);
            // add listener -- outer click
            if (!tagCategoriesListener) {
                document.addEventListener("click", function (e) {
                    // e.preventDefault();
                    tagCategoriesListener = true;
                    if (!hasCommonElements(
                        [...Array.from(e.target.classList), ...Array.from(e.target.parentNode.classList)],
                        classToClick)
                    ) {
                        toggleClass(elemToToggle, classToToggle, true);
                    }
                    // !!remove
                    // document.removeEventListener("click", this)
                })
            }
            if (activeType === e.target?.dataset?.cats) return;

            // filter after switching category
            Array.from(publications).forEach(pub =>
                e.target.dataset.cats === "all" || pub.dataset.cat === e.target.dataset.cats ?
                    pub.classList.remove("hidden") :
                    pub.classList.add("hidden")
            );
            // clear after switching category
            Array.from(tagActives).forEach(tag => tag.classList.add("hidden"));
            Array.from(tagFilters).forEach(tag => tag.classList.remove("active"));

            // cats highlight
            one.classList.add("active")
            Array.from(tagCatsContainer.children).forEach((cat, index2) => index !== index2 ? cat.classList.remove("active") : "");
            // table tags show|hide
            if (e?.target?.dataset?.cats) {
                activeType = e.target.dataset.cats;
                Array.from(tagFilters).forEach(filt => {
                    filt.classList.remove("active");
                    filt.classList.remove("hidden");
                    if (activeType !== "all") {
                        if (!tagsGroups[activeType].includes(filt.dataset.filterTag)) {
                            filt.classList.add("hidden");
                        }
                    }
                })
            }
        }));
        Array.from(tagFilters).forEach((filt, findex) => {
            filt.addEventListener('click', (event) => {
                event.preventDefault();
                // const activeFilters = Array.from(tagFilters).filter(filt => filt.classList.contains("active"));
                if (filt.dataset.filterTag === "clear") {
                    Array.from(tagActives).forEach(tag => tag.classList.add("hidden"));
                    Array.from(publications).forEach(pub => pub.classList.remove("hidden"));
                    Array.from(tagFilters).forEach(filt => filt.classList.remove("active"));
                } else {
                    // active tags
                    const tagToToggle = Array.from(tagActives).find(tag => tag.dataset.filterTag === filt.dataset.filterTag);
                    if (tagToToggle) {
                        if (tagToToggle.classList.contains("hidden")) {
                            tagToToggle.classList.remove("hidden");
                            //click on active filter
                            tagToToggle.addEventListener("click", () => {
                                filt.classList.remove("active");
                                tagToToggle.classList.add("hidden");
                                activeFilters.delete(findex);
                                // publcations show|hide
                                if (!activeFilters.size) {
                                    // no filters
                                    Array.from(publications).forEach(pub => {
                                        pub.classList.remove("hidden");
                                    })
                                } else {
                                    // with filters
                                    Array.from(publications).forEach(pub => {
                                        pub.classList.remove("hidden");
                                        if (!hasCommonElements(Array.from(activeFilters.values()), [pub.dataset.tag])) {
                                            pub.classList.add("hidden");
                                        }
                                    })
                                }
                            })
                        } else {
                            tagToToggle.classList.add("hidden");
                        }
                    }
                    if (filt.classList.contains("active")) {
                        filt.classList.remove("active");
                        activeFilters.delete(findex);
                    } else {
                        filt.classList.add("active");
                        activeFilters.set(findex, filt.dataset.filterTag);
                    }
                    // publcations show|hide
                    if (!activeFilters.size) {
                        // no filters
                        Array.from(publications).forEach(pub => {
                            pub.classList.remove("hidden");
                        })
                    } else {
                        // with filters
                        Array.from(publications).forEach(pub => {
                            pub.classList.remove("hidden");
                            if (!hasCommonElements(Array.from(activeFilters.values()), [pub.dataset.tag])) {
                                pub.classList.add("hidden");
                            }
                        })
                    }
                }
            })
        })
    }
    //tags single filters

    //Архив портфолио, пейджинг. Размер страницы - 4 элемента
    let archiveList = document.querySelector(".js-portfolio-archive");
    const pageSize = 4;
    if (archiveList) {
        let archiveCards = archiveList.querySelectorAll('.card');
        if (archiveCards.length > pageSize) {
            let curPageNumber = 1;
            let pagesNumber = Math.ceil(archiveCards.length / pageSize);
            archiveList.innerHTML = '';

            for (i = 1; i < pagesNumber + 1; i++) {
                let nextPageContainer = document.createElement('div');
                nextPageContainer.className = 'projects__list js-archive-projects-page';
                if (i > 1) nextPageContainer.className += ' hidden';
                nextPageContainer.dataset.filterPage = i;
                for (j = (i - 1) * pageSize; j < i * pageSize; j++) {
                    if (j < archiveCards.length) {
                        nextPageContainer.innerHTML += archiveCards[j].outerHTML;
                    }
                }
                archiveList.innerHTML += nextPageContainer.outerHTML;
            }

            let paginatorContainer = document.createElement('div');
            paginatorContainer.className = 'redesign-archive__pagination';
            for (i = 1; i < pagesNumber + 1; i++) {
                let nextPaginatorElement = document.createElement('div');
                nextPaginatorElement.className = 'page-wrapper js-page-switcher';
                if (i == 1) nextPaginatorElement.className += ' active';
                nextPaginatorElement.dataset.pageSwitch = i;
                nextPaginatorElement.innerHTML = '<div class="page" data-page-switch="' + i + '">' + i + '</div>';
                paginatorContainer.innerHTML += nextPaginatorElement.outerHTML;
            }
            archiveList.innerHTML += paginatorContainer.outerHTML;
        }
    }

    if (document.querySelectorAll(".js-page-switcher").length > 0) {
        const pagination = document.querySelectorAll(".js-page-switcher");
        const pages = document.querySelectorAll(".js-archive-projects-page");
        const anchor = document.getElementById("redesign-archive__header")
        Array.from(pagination).forEach((one) => one.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const selected = e?.target?.dataset?.pageSwitch;
            Array.from(pagination).forEach((two) => two.classList.remove("active"));
            one.classList.add("active");
            if (!selected && selected !== 0) return;
            Array.from(pages).forEach((page) => {
                page.dataset.filterPage === selected ? page.classList.remove("hidden") : page.classList.add("hidden");
            })
            if (anchor) {
                anchor.scrollIntoView({
                    behavior: "smooth"
                })
            }
        }))
    }
    //обработчик загрузки файлов в форме заявки
    if (document.querySelectorAll(".yaDiskUploader").length > 0) {
        const uploadButtons = document.querySelectorAll(".yaDiskUploader");
        let curButton;
        for (i = 0; i < uploadButtons.length; i++) {
            curButton = uploadButtons[i];
            curButton.addEventListener("click", function (e) {
                e.preventDefault();
                if (!(curButton.classList.contains("js-upload-started"))) curButton.classList.add("js-upload-started");
            }, false);
        }
    }

    // redesign
    if (document.querySelectorAll(".js-expert-slider").length > 0) {
        if (document.querySelector('.slider-container')) {
            // const container = document.querySelector(".js-expert-slider");
            const sliderExpert = tns({
                container: '.js-expert-slider .slider-container',
                gutter: 0,
                controls: false,
                nav: true,
                navPosition: 'bottom',
                navContainer: '.js-expert-slider .js-expert-dots',
                mouseDrag: true,
                slideBy: 'page',
                mode: 'gallery',
            });
            // desired do call any slider from any place at 
            // switching slides by click into block
            if (document.querySelectorAll(".js-switch").length > 0) {
                const sw = document.querySelectorAll(".js-switch")[0];
                // const data = sw.dataset;
                // && data.switchClass
                if (sw.children?.length) {

                    for (let one = 0; one < sw.children.length; one++) {
                        const child = sw.children[one];
                        child.addEventListener('click', function () {
                            sliderExpert.goTo(one);
                            // clear selection
                            for (let two = 0; two < sw.children.length; two++) {
                                sw.children[two].classList.remove("active")
                            }
                            child.classList.add("active");
                        })
                    }

                    function onExpertChangeSlide(e) {
                        for (let two = 0; two < sw.children.length; two++) {
                            sw.children[two].classList.remove("active")
                        }
                        sw.children[e.displayIndex - 1].classList.add("active");
                    }
                    sliderExpert.events.on('indexChanged', onExpertChangeSlide);

                }
            }
        }
    }

    if (document.querySelectorAll(".js-children-click-set-active").length > 0) {
        const wrappers = document.querySelectorAll(".js-children-click-set-active");
        wrappers.forEach(wrap => {
            Array.from(wrap.children).forEach(child => {
                child.addEventListener('click', (e) => {
                    if (!child.classList.contains("active")) {
                        Array.from(wrap.children).forEach(child => {
                            child.classList.remove("active");
                        })
                        child.classList.add("active");
                        const isSync = child.dataset.clickSync;
                        if (isSync) {
                            const nodes = [...document.querySelectorAll(".js-click-sync")];
                            const elem = nodes?.find(node => node.dataset?.clickSync === isSync);
                            if (elem) {
                                nodes.forEach(one => {
                                    one?.classList.add("hide")
                                })
                                elem.classList.remove("hide")
                            }
                        }
                        if (windowWidth <= 480) {
                            wrap.scrollTo({ behavior: "smooth", left: child.offsetLeft - 20 });
                        } else if (windowWidth <= 650) {
                            wrap.scrollTo({ behavior: "smooth", left: child.offsetLeft - 30 });
                        }
                    }
                })
            })
        });
    }

    if (document.querySelectorAll(".js-archive-slider").length > 0) {
        Array.from(document.querySelectorAll(".js-archive-slider")).forEach(slider => {
            tns({
                container: slider.querySelector(".slider-container"),
                navContainer: slider.querySelector(".js-archive-dots"),
                items: 1,
                gutter: 10,
                controls: false,
                nav: true,
                navPosition: 'bottom',
                mouseDrag: true,
                slideBy: 'page'
            });
        })
    }

    if (document.querySelectorAll(".js-service-v2-timeline-mobile-slider").length > 0) {
        Array.from(document.querySelectorAll(".js-service-v2-timeline-mobile-slider")).forEach(slider => {
            tns({
                container: slider.querySelector(".slider-container"),
                // navContainer: slider.querySelector(".js-service-v2-timeline-mobile-slider-dots"),
                items: 1.25,
                gutter: 0,
                controls: false,
                nav: false,
                // navPosition: 'bottom',
                mouseDrag: true,
                infinite: true,
                slideBy: 'page',
                fixedWidth: 346
            });
        })
    }

    if (document.querySelectorAll(".js-window-location").length > 0) {
        Array.from(document.querySelectorAll(".js-window-location")).forEach(link => {
            link.addEventListener("click", () => {
                if (link.dataset.href) {
                    window.location = link.dataset.href;
                }
            })
        })
    }

    // Обработка клика на страницах dummy
    if (document.querySelector('.js-history-back') != null) {
        document.querySelector('.js-history-back').addEventListener("click", (e) => {
            if (e.target.classList.contains('js-history-back')) {
                e.preventDefault();
                window.history.back();
            }
        })
    }

    // services redesign accordion 
    if (document.querySelectorAll(".js-accordion-redesign").length > 0) {
        const accordions = document.querySelectorAll(".js-accordion-redesign");
        let scrollNavigationContainer = document.querySelector(".js-scroll-navigation");

        Array.from(accordions).forEach(acc => {
            const tabs = acc.querySelectorAll(".js-accordion-tab");
            Array.from(tabs).forEach(tab => {
                const tabhead = tab.querySelector(".tab__head");
                // const tabroll = tab.querySelector(".tab__roll");
                tabhead?.addEventListener("click", (e) => {
                    if(scrollNavigationContainer) {
                        const lev1Sel = scrollNavigationContainer.querySelectorAll(".case-container__toc-lev1");
                        let lev2Sel = Array.from(lev1Sel)[acc.dataset.accordionContainer-1].querySelectorAll(".case-container__toc-lev2 .js-scrollto");
                        Array.from(lev2Sel).forEach(lev2 => {
                            lev2?.classList.remove("active");
                        })
                        Array.from(lev2Sel)[tab.dataset.accordionTab-1].classList.add("active");
                    }
                    Array.from(tabs).forEach(tabinner=> {
                        tabinner.classList.remove("active");
                    })
                    tab.classList.contains("active") ? tab.classList.remove("active") : tab.classList.add("active");
                    e.target.scrollIntoView({
                        behavior: "smooth"
                    })
                })
            })

            const navlinks = acc.querySelectorAll(".js-accordion-link");

            Array.from(navlinks).forEach((nav, index) => {
                nav?.addEventListener("click", (e) => {
                    if (!tabs[index].classList.contains("active")) {
                        Array.from(tabs).forEach(tab => {
                            tab.classList.remove("active");
                        })
                        tabs[index].classList.add("active");
                        // })
                    }
                    if (!nav.classList.contains("active")) {
                        Array.from(navlinks).forEach((nav2) => {
                            nav2.classList.remove("active");
                        })
                        nav.classList.add("active");
                    }
                })
            })
        })
    }


    //--redesign
    if (document.querySelectorAll("iframe").length > 0) {
        initVideo();
    }

    //генератор таймлайна на странице кейса
    let timeline = document.querySelector(".js-timeline");
    let timelineGrid = document.querySelector(".js-timeline-grid");
    let timelineEvents = document.querySelector(".js-timeline-events");
    if (timeline != null && timelineGrid != null && timelineEvents != null) {
        // события: заполняем контейнер событий
        let events = timelineEvents.querySelectorAll("div");
        let eventList = "";
        let tlOuter = document.createElement('div');
        tlOuter.className = 'timeline_outer';
        let tlContainer = document.createElement('div');
        tlContainer.className = 'timeline loading';
        for (i = 0; i < events.length; i++) {
            let curNode = document.createElement('a');
            curNode.classList.add("timeline_event");
            curNode.classList.add("js-timeline_event");
            curNode.setAttribute("data-fullname", events[i].dataset.fullname);
            curNode.setAttribute("data-start", events[i].dataset.start);
            curNode.setAttribute("data-text", events[i].dataset.text);
            curNode.innerHTML = events[i].dataset.name + '<i></i>';
            eventList += curNode.outerHTML;
        }
        tlContainer.innerHTML = '<div class="timeline_container">' + eventList + '</div>';
        timeline.before(tlOuter);
        tlOuter.append(tlContainer);

        // события: обработка клика
        let nodes = tlContainer.querySelectorAll(".js-timeline_event");
        let openNodes;
        function openEventNode(e) {
            openNodes = document.querySelectorAll(".timeline_event-open");
            for (i = 0; i < openNodes.length; i++) {
                openNodes[i].remove();
            }
            let openMainNodes = document.querySelectorAll(".js-timeline_event");
            for (i = 0; i < openMainNodes.length; i++) {
                if (openMainNodes[i].classList.contains("open") && openMainNodes[i] != e)
                    openMainNodes[i].classList.remove("open");
            }
            let openNode = document.createElement('div');
            openNode.classList.add("timeline_event");
            openNode.classList.add("timeline_event-open");
            // для правых элементов открываем описание налево
            let contWidth = parseInt(document.querySelector(".timeline").style.width);
            if (parseInt(e.style.left) + 300 > contWidth)
                openNode.style.right = contWidth - (parseInt(e.style.left) + parseInt(e.dataset.width)) + "px";
            else
                openNode.style.left = e.style.left;
            for (i = 1; i < 9; i++) {
                if (e.classList.contains("level" + i)) {
                    openNode.classList.add("level" + i);
                    break;
                }
            }
            openNode.innerHTML = "<h4 class=\"timeline_event-fullname\"><i></i>" + e.dataset.fullname + "</h4><p class=\"timeline_event-fulltext\">" + e.dataset.text + "</p>";
            document.querySelector(".timeline_container").appendChild(openNode);
            document.querySelector(".timeline_event-fullname i").addEventListener("click", function (evt) {
                evt.stopPropagation();
                evt.target.parentNode.parentNode.remove();
                document.querySelector(".timeline_container").classList.remove("open");
                openNodes = document.querySelectorAll(".timeline_event");
                for (i = 0; i < openNodes.length; i++) {
                    openNodes[i].classList.remove("open");
                }

            });
        }
        for (i = 0; i < nodes.length; i++) {
            nodes[i].setAttribute("data-width", nodes[i].getBoundingClientRect().width);
            nodes[i].addEventListener("click", function (e) {
                e.preventDefault();
                if (this.classList.contains("open")) {
                    this.classList.remove("open");
                    this.parentElement.classList.remove("open");
                }
                else {
                    this.parentElement.classList.add("open");
                    this.classList.add("open");
                    openEventNode(this);
                }
            }, false);
        }
        timeline.remove();

        // события: расставляем по контейнеру и по уровням
        const nodeGap = 12;
        let paddingVert = 60;
        let paddingLeft = parseInt(getComputedStyle(document.querySelector(".timeline_container")).paddingLeft);
        let containerWidth = document.querySelector(".timeline_container").getBoundingClientRect().width - 2 * paddingLeft;
        let tempWidth = containerWidth;
        for (i = 0; i < nodes.length; i++) {
            if (nodes[i].dataset.start > 0 && ((containerWidth - nodes[i].dataset.width * 1) / nodes[i].dataset.start < tempWidth))
                tempWidth = (containerWidth - nodes[i].dataset.width * 1) / nodes[i].dataset.start;
        }
        containerWidth = tempWidth * timeline.dataset.width;
        let nodeLevels = new Array(8);
        let maxLevelUsed;
        nodeLevels.fill(0);
        for (i = 0; i < nodes.length; i++) {
            if (i == 0) {
                nodes[0].setAttribute("data-level", 1);
                nodes[0].style.left = paddingLeft + "px";
                nodes[0].classList.add("level1");
                nodeLevels[1] = paddingLeft + nodes[0].dataset.width * 1 + nodeGap;
                maxLevelUsed = 1;
            }
            else {
                let curLeft = paddingLeft + nodes[i].dataset.start * containerWidth;
                nodes[i].style.left = curLeft + "px";

                for (lev = 1; lev < nodeLevels.length + 1; lev++) {
                    if (nodeLevels[lev] * 1 < curLeft) {
                        nodes[i].setAttribute("data-level", lev);
                        nodeLevels[lev] = curLeft + nodes[i].dataset.width * 1 + nodeGap;
                        nodes[i].classList.add("level" + lev);
                        if (lev > maxLevelUsed) maxLevelUsed = lev;
                        break;
                    }
                }
            }
        }
        let timelineHeight = 2 * paddingVert + maxLevelUsed * 62 + "px"
        document.querySelector(".timeline_container").style.height = timelineHeight;
        document.querySelector(".timeline_outer").style.height = timelineHeight;
        document.querySelector(".timeline").style.width = (document.querySelector(".timeline_container").getBoundingClientRect().width) * timeline.dataset.width + "px";

        // сетка
        let milestones = timelineGrid.querySelectorAll("div");
        let milestoneList = "";
        for (i = 0; i < milestones.length; i++) {
            let curMilestone = document.createElement('div');
            curMilestone.classList.add("timeline_milestone");
            let curLeft = paddingLeft + milestones[i].dataset.start * containerWidth;
            let nextLeft = (i != milestones.length - 1) ? milestones[i + 1].dataset.start : 1;
            let curWidth = (nextLeft - milestones[i].dataset.start) * containerWidth;
            curMilestone.style.left = curLeft + "px";
            (i != milestones.length - 1) ? curMilestone.style.width = curWidth + "px" : curMilestone.style.right = "0";
            curMilestone.innerHTML = milestones[i].dataset.name;
            milestoneList += curMilestone.outerHTML;
        }
        let milestoneContainer = document.createElement('div');
        milestoneContainer.classList.add("timeline_container-milestones");
        milestoneContainer.innerHTML = milestoneList;
        tlContainer.appendChild(milestoneContainer);

        tlContainer.classList.remove("loading");

        // drag
        let parent = document.querySelector('.timeline_outer');
        let parentRect = parent.getBoundingClientRect();

        let draggable = document.querySelector('.timeline');
        let draggableRect = draggable.getBoundingClientRect();

        let dragging = false;

        let startingPoint = 0;
        let currentPoint = 0;

        function moveStart(e) {
            e.preventDefault();
            dragging = true;
            startingPoint = e.clientX - draggableRect.left - currentPoint;
        }

        function moveEnd(e) {
            e.preventDefault();
            dragging = false;
            currentPoint = draggable.style.left.substr(0, draggable.style.left.length - 2);
        }

        function moving(e) {
            e.preventDefault();
            if (dragging) {
                if ( //(e.clientX >= parentRect.left && (e.clientX+draggableRect.width <= parentRect.right)) &&
                    //(e.clientY >= parentRect.top && (e.clientY+draggableRect.height <= parentRect.bottom))  
                    true
                ) {
                    //add draggableRect.width draggableRect.height accoints for

                    draggable.style.left = `${e.clientX - startingPoint}px`;
                    //draggable.style.top = `${e.clientY}px`;
                }
                else {
                    //if mouse went out of bounds in Horizontal dir.
                    if (e.clientX + draggableRect.width >= parentRect.right) {
                        draggable.style.left = `${parentRect.right - draggableRect.width}px`;
                    }
                    //if mouse went out of bounds in Vertical dir.
                    if (e.clientY + draggableRect.height >= parentRect.bottom) {
                        draggable.style.top = `${parentRect.bottom - draggableRect.height}px`;
                    }
                }

            }

        }

        document.querySelector(".timeline_outer").addEventListener("mousedown", moveStart);
        document.querySelector(".timeline_outer").addEventListener("mousemove", moving);
        document.querySelector(".timeline_outer").addEventListener("mouseup", moveEnd);
    }

    //информер внизу страницы
    if (document.querySelectorAll('.js-close-informer').length > 0){
        document.addEventListener('click', function (e) {
            if (e.target.classList.contains('js-close-informer')) {
                e.preventDefault();
                setinformerIsRead(true, e.target);
            }
        }, true);
        setinformerIsRead(false, null);
    }

    //слайдер на странице about ver.2
    if (document.querySelectorAll(".js-about-rewards-slider").length > 0) {
        Array.from(document.querySelectorAll(".js-about-rewards-slider")).forEach(slider => {
            tns({
                container: slider.querySelector(".about-rewards__slider-container"),
                navContainer: slider.querySelector(".about-rewards__slider-dots ul"),
                items: 1,
                gutter: 10,
                controls: false,
                nav: true,
                navPosition: 'bottom',
                mouseDrag: true,
                slideBy: 'page'
            });
        })
    }

});