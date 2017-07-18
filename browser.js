
var anonymPrefix = 'http://anonymz.com/?';
var proxyPrefixes = [/*'http://localhost:8888/', */'https://crossorigin.me/', 'https://cors-anywhere.herokuapp.com/'];
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
					var origin = $csfdHtml.find('.content .info .origin').text();
					var name = $csfdHtml.find('.episode.header h1').text();
					localStorage.setItem(csfdHref, JSON.stringify({ rating: rating, genre: genre, name: name, origin: origin }));
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
			if (!cachedValues.name) {
				fetchCsfd();
			}
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

function nameFromCsfdUri(csfdUri) {
	return csfdUri.substring(csfdUrl.length + '/film/'.length, csfdUri.length - 1).replace(/\d+/g, '').replace(/-/g, ' ');
}

function allIsPartOfString(string, allContain) {
	for (var contain of allContain) {
		if (string.toLowerCase().indexOf(contain) === -1) {
			return false;
		}
	}
	return true;
}

function filter() {
	var torrentDetailMapByCsfdUri = Object.keys(localStorage).reduce(function (index, detailUri) {
		index[localStorage[detailUri]] = detailUri;
		return index;
	}, {});

	var $filterForm = $('<form/>');
	var $inputGenre = $('<input/>').attr('id', 'input-genre').attr('placeholder', 'Genre').val(localStorage['input-genre']);
	var $inputMinRating = $('<input/>').attr('id', 'input-minRating').attr('type', 'number').attr('placeholder', 'Min. ratting').val(localStorage['input-minRating']);
	var $buttonFilter = $('<button/>').text('Filter');
	$filterForm.append($inputGenre).append($inputMinRating).append($buttonFilter);
	$('.search_box').after($filterForm);
	$filterForm.on('submit', function (ev) {
		ev.preventDefault();
		var filteredUris = [];
		var genre = $inputGenre.val().toLowerCase();
		var minRating = $inputMinRating.val() ? parseInt($inputMinRating.val()) : 0;
		localStorage.setItem('input-genre', genre);
		localStorage.setItem('input-minRating', minRating);
		for (var uri in localStorage) {
			if (uri.indexOf(csfdUrl) === 0) {
				var stats = JSON.parse(localStorage[uri]);
				if (allIsPartOfString(stats.genre, genre.split(' ')) && stats.rating >= minRating) {
					filteredUris.push(uri);
				}
			}
		}
		$('.filtered-row').remove();
		for (var csfdUri of filteredUris) {
			var stats = JSON.parse(localStorage[csfdUri]);
			var $empty = $('<td/>').text(' ');
			var $genre = $('<td/>').addClass('categorie').attr('colspan', 2).text(stats.genre);
			var detailUri = torrentDetailMapByCsfdUri[csfdUri];
			var $nameLink = $('<a/>').attr('href', detailUri).css('font-size', '150%').css('font-weight', 'bold').text(stats.name || nameFromCsfdUri(csfdUri) || '?');
			var $origin = $('<div/>').text(stats.origin || '?');
			var $csfd = $('<a/>').attr('href', csfdUri).text('ČSFD');
			var $name = $('<td/>').addClass('detaily').attr('colspan', 3).append($nameLink).append($origin).append($csfd);
			var $rating = $('<td/>').addClass('coment').attr('colspan', 1).text(stats.rating + '%');
			var $tableRow = $('<tr/>').addClass('filtered-row').addClass('torr_hover')
				.after($empty)
				.append($genre)
				.after($empty)
				.append($name)
				.after($empty)
				.append($rating)
				.after($empty)
				.after($empty)
				.after($empty)
				;
			$('#torrenty .popisy').after($tableRow);
		}
	});
}

filter();
