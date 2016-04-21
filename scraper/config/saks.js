var _ = require('underscore');
var cheerio = require('cheerio');
var listingsURL = 'http://www.saksfifthavenue.com/Shoes/shop/' +
  '_/N-52k0s7/Ne-6lvnb5';

/*
 * Saks' Listings class
 *
 */
function Listings(html) {
  this.$ = cheerio.load(html);
}

Listings.prototype.getItemURLs = function() {
  var $ = this.$;
  return $('.product-text a.mainBlackText').map(function() {
    return $(this).attr('href');
  }).get();
};

Listings.prototype.getNextPageURL = function() {
  var $ = this.$;
  var nextPage = $('.pa-enh-pagination-right-arrow').attr('href');
  return nextPage ? (listingsURL + nextPage.split('?')[1]) : false;
};

/*
 * Saks' Item class
 *
 */
function Item(html) {
  this.$ = cheerio.load(html);
  this.data = setupItem(this.$);
}

var setupItem = function($) {
  var priceHTML = $('.product-pricing__price').last().find('span');

  var data = {
    retailer: 'Saks Fifth Avenue',
    productId: $('.product-overview__product-code').html(),
    designer: $('.product-overview__brand-link').html(),
    productName: $('.product-overview__short-description').html(),
    details: $('.product-description ul').html(),

    // neef to account for multiple colors
    color: $('.product-color-options__selected-value').html(),
    price: priceHTML.last().html(),
    priceCurrency: priceHTML.first().html(),
    url: $('meta[property="og:url"]').attr('content'),
    images: getItemImages() || []
  };

  return data;
};

var getItemImages = function(color) {
  /*
   * Saks' default item page doesn't provide image URLs. Instead, we'll assume
   * that every item has 5 images, and use the known conventions to construct
   * the image URLs for each item.
   *
   */
  var IMAGE_URL = 'http://s7d9.scene7.com/is/image/saks/' + data.productId;

  return _.map(_.range(5), function(i) {
    var suffix = (i === 0) ? '' : '_A' + i;
    var colorSuffix = color ? '_' + color.toUpperCase() : '';
    var image = {
      url: IMAGE_URL + suffix + colorSuffix
    };
    if (i === 0) {
      image.primary = true;
    }

    return image;
  });
};

Item.prototype.getOtherColors = function() {
  var $ = this.$;
  var colorsHTML = $('.product-color-options');

  // should return false if there is only one color
  if (colorsHTML.children().length() === 1) {
    return false;
  } else {
    var colors = colorsHTML.find('li').map(function(i) {
      if (i > 0) return $(this).attr('title');
    }).get();

    return {
      type: 'text',
      colors: colors
    };
  }
};

// Only needed for retailers whose other colors don't generate a new URL
Item.prototype.changeColor = function(newColor) {
  this.data.color = newColor;
  this.data.images = getItemImages(newColor);
};

module.exports.listingsURL = listingsURL;
module.exports.Listings = Listings;
module.exports.Item = Item;
