
var data = {
    query: {},
    sort: {updatedAt: -1, id: -1},
    cursor:
        {
            updatedAt: '2019-11-04T14:13:47.502Z',
            _id: '5dc0321be686cfed337521f1'
        },
    direction: -1,
    count: 20
}

var toQueryParams = function (prefix, o) {
    Object.keys(o).forEach(function (key) {

    });
};

var toUrl = function (url, data) {
  Object.keys(data).forEach(function (key) {
      var o = data[key];
      var keys = Object.keys(o);
      if (!keys.length) {
          return;
      }

  });
};

console.log(toUrl('https://www.serandives.lk/', data));
