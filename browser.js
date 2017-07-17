
var anonymPrefix = 'http://anonymz.com/?';
var proxyPrefixes = ['http://localhost:8888/', 'https://crossorigin.me/', 'https://cors-anywhere.herokuapp.com/'];
var csfdUrl = 'http://www.csfd.cz';
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
				var csfdAnonymHref = $detailHtml.find("a[href*='" + anonymPrefix + csfdUrl + "/film/']").attr('href');
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

function filter() {
	var $filterForm = $('<form/>');
	var $inputGenre = $('<input/>').attr('id', 'input-genre').attr('placeholder', 'Genre');
	var $inputMinRating = $('<input/>').attr('id', 'input-minRating').attr('type', 'number').attr('placeholder', 'Min. ratting');
	var $buttonFilter = $('<button/>').text('Filter');
	$filterForm.append($inputGenre).append($inputMinRating).append($buttonFilter);
	$('.search_box').after($filterForm);
	$filterForm.on('submit', function (ev) {
		ev.preventDefault();
		var filteredUris = [];
		var genre = $inputGenre.val();
		var minRating = parseInt($inputMinRating.val());
		for (var uri in localStorage) {
			if (uri.indexOf(csfdUrl) === 0) {
				var stats = JSON.parse(localStorage[uri]);
				if (stats.genre.indexOf(genre) !== -1 && stats.rating >= minRating) {
					filteredUris.push(uri);
				}
			}
		}
		for (var uri of filteredUris) {
			var stats = JSON.parse(localStorage[uri]);
			var $empty = $('<td/>');
			var $name = $('<td/>').attr('colspan', 3).text(uri);
			var $genre = $('<td/>').attr('colspan', 2).text(stats.genre);
			var $rating = $('<td/>').attr('colspan', 1).text(stats.rating + '%');
			var $tableRow = $('<tr/>').after($empty).after($empty).after($empty).append($name).append($genre).append($rating);
			$('#torrenty .popisy').after($tableRow);
		}
	});
}

filter();
