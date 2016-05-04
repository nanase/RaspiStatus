var json_path = 'http://nanase.cc/raspi/status/json/';
var raspi_height = 34.6;

function secondToTime(t) {
    var z = v => (v < 10 ? '0' : '') + v;
    var h = t / 3600 | 0;
    var m = t % 3600 / 60 | 0;
    var s = t % 60;
    return (h != 0) ? h + ":" + z(m) + ":" + z(s) :
        (m != 0) ? m + ":" + z(s) : s + " seconds";
}

function unixtimeToString(unixtime) {
    var d = new Date(unixtime * 1000);
    return d.getHours() + ':' + ('0' + d.getMinutes()).substr(-2) + ':' + ('0' + d.getSeconds()).substr(-2);
}

function round(value, precision = 0) {
    var d = Math.pow(10, precision);
    var s = (Math.round((value + 0) * d) / d) + '';

    if (precision > 0) {
        var c = s.match(/\.(\d+)/);

        if (!c)
            return s + '.' + '0'.repeat(precision);
        if (c[1].length < precision)
            return s + '0'.repeat(precision - c[1].length);
    }

    return s;
}

function getSeaPressure(h, t, p) {
    return p * Math.pow(1 - 1 / ((t + 273.15) / (0.0065 * h) + 1), -5.257);
}

function getDiscomfortIndex(t, h) {
    return 0.81 * t + 0.01 * h * (0.99 * t - 14.3) + 46.3;
}

function getSizeString(s) {
    if (s < 1000)
        return [s + '', 'bytes'];
    if (s < 1024000)
        return [round(s / 1024.0, 0), 'KiB'];
    if (s < 1048576000)
        return [round(s / 1048576.0, 2), 'MiB'];

    return [round(s / 1073741824.0, 3), 'MiB'];
}

function wait_start() {
    $('.updatebar')
        .delay(50000)
        .animate({
            width: "100%"
        }, 10000, 'linear', load_json);
}

function load_json() {
    $.getJSON(json_path, function(json) {
        $('.updatebar')
            .animate({
                width: "0%"
            }, 500, 'easeOutExpo');

        if (json.succeed) {
            $('.obox-temp .display-big').text(round(json.indoor.temperature, 2));
            $('.obox-hum .display-big').text(round(json.indoor.humidity, 2));
            $('.obox-press .display-big').text(round(json.indoor.pressure, 1));

            $('.obox-otemp .display-big').text(round(json.outdoor.temperature, 2));
            $('.obox-vis .display-big').text(round(json.outdoor.visibility / 1000.0, 1));
            $('.obox-spress .display-big').text(round(getSeaPressure(raspi_height, json.outdoor.temperature, json.indoor.pressure), 1));

            $('.obox-wind .display-dir').css({
                transform: 'rotate(' + (-json.outdoor.wind_deg + 180.0) + 'deg) scale(1, 0.5)'
            });
            $('.obox-wind .display-big').text(round(json.outdoor.wind_speed, 1));
            $('.obox-dcmf .display-big').text(round(getDiscomfortIndex(json.indoor.temperature, json.indoor.humidity), 1));

            $('.obox-uptime .display-big').text(secondToTime(json.indoor.uptime | 0));
            $('.obox-obtime .display-big').text(unixtimeToString(json.indoor.time | 0));

            var dbsize = getSizeString(json.system.db_size);
            $('.obox-dbsize .display-big').text(dbsize[0]);
            $('.obox-dbsize .display-unit').text(dbsize[1]);
        }

        wait_start();
    }).fail(function() {
        $('.errorbar')
            .animate({
                width: "100%"
            }, 250, 'linear')
            .animate({
                width: "0%"
            }, 30000, 'linear', load_json)
    });
}

$(load_json);
