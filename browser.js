
var anonymPrefix = 'http://anonymz.com/?';
var proxyPrefixes = ['http://localhost:8888/', 'https://crossorigin.me/', 'https://cors-anywhere.herokuapp.com/'];
var proxyPrefixIndex = 0;

function csfd($pageTorrs) {
$pageTorrs.each(function () {
	var detailUrl = $(this).find('.detaily a:first').attr('href');
	var $detaily = $(this).find('.detaily');
	var loadCsfd = function (csfdHref) {
		var updateDom = function (rating, genre) {
			if (rating && rating != 'undefined') {
				$detaily.append($('<span style="color: black;font-size: 150%;margin-left:10px;display:inline-block;">' + rating + '%</span>'));
			}
			if (genre) {
				$detaily.append($('<span style="color: black;font-size: 130%;margin-left:10px;display:inline-block;">' + genre + '</span>'));
			}
		};
		var fetchCsfd = function () {
			var proxyPrefix = proxyPrefixes[proxyPrefixIndex % proxyPrefixes.length];
			var csfdHrefProxy = proxyPrefix + csfdHref;
			console.log(csfdHrefProxy);
			$.ajax({
				type: "GET",
				dataType: 'html',
				url: csfdHrefProxy,
				headers: {
					origin: window.location.href
				},
				success: function (response) {
					var $csfdHtml = $(response);
					var rating = $csfdHtml.find("#rating meta[itemprop='ratingValue']").attr('content');
					var genre = $csfdHtml.find('.content .info .genre').text();
					localStorage.setItem(csfdHref, JSON.stringify({ rating: rating, genre: genre }));
					updateDom(rating, genre);
				},
				error: function (response) {
					console.error(response);
					proxyPrefixIndex++;
					setTimeout(fetchCsfd, proxyPrefixIndex * 100);
				}
			});
		};
		var cachedItem = localStorage.getItem(csfdHref);
		if (cachedItem !== null) {
			var cachedValues = JSON.parse(cachedItem);
			updateDom(cachedValues.rating, cachedValues.genre);
		} else {
			fetchCsfd();
		}
	};
	var cachedCsfdUrl = localStorage.getItem(detailUrl);
	if (cachedCsfdUrl !== null) {
		if (cachedCsfdUrl !== '') {
			loadCsfd(cachedCsfdUrl);
		}
	} else {
		$.ajax({
			type: "GET",
			dataType: 'html',
			url: detailUrl,
			success: function (response) {
				var $detailHtml = $(response);
				var csfdAnonymHref = $detailHtml.find("a[href*='" + anonymPrefix + "http://www.csfd.cz/film/']").attr('href');
				if (csfdAnonymHref) {
					var csfdHref = csfdAnonymHref.substring(anonymPrefix.length);
					localStorage.setItem(detailUrl, csfdHref);
					loadCsfd(csfdHref);
				} else {
					localStorage.setItem(detailUrl, '');
				}
			},
			error: function (response) {
				console.error(response);
			}
		});
	}
});
}

csfd($('.torr_hover'));

var lastPage = 1;
var discoverPages = function () {
	var nextPageUrl = window.location.href + '&p=' + (lastPage + 1);
	$.ajax({
		type: "GET",
		dataType: 'html',
		url: nextPageUrl,
		success: function (response) {
			console.log('loaded page', lastPage);
			lastPage++;
			var $nextPage = $(response);
			var $pageTorrs = $nextPage.find(".torr_hover");
			if ($pageTorrs.length > 0) {
				csfd($pageTorrs);
				setTimeout(discoverPages, lastPage * 1e3);
			}
		},
		error: function (response) {
			console.error(response);
			setTimeout(fetchCsfd, 2e3);
		}
	});
};
discoverPages();
