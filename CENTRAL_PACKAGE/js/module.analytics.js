angular.module('multipleAnalytics', []);
angular.module('multipleAnalytics').run(function ($rootScope, $interval, csuOptions, analyticsOptionsDefault) {
    var enabled = csuOptions.hasOwnProperty("analyticsEnabled") ? csuOptions.analyticsEnabled : analyticsOptionsDefault.enabled;
    var siteSource = csuOptions.hasOwnProperty("siteSource") ? csuOptions.siteSource : analyticsOptionsDefault.siteSource;
    var siteId = csuOptions.hasOwnProperty("siteId") ? csuOptions.siteId : analyticsOptionsDefault.siteId;
    var siteUrl = csuOptions.hasOwnProperty("siteUrl") ? csuOptions.siteUrl : analyticsOptionsDefault.siteUrl;
    var defaultTitle = csuOptions.hasOwnProperty("defaultTitle") ? csuOptions.defaultTitle : analyticsOptionsDefault.defaultTitle;
  if(enabled) {
    if(siteId != '') {
      if(siteSource === 'ga') {
        if(typeof ga === 'undefined') {
          (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
          (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
          m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
          })(window,document,'script',siteUrl,'ga');

          ga('create', siteId, {'alwaysSendReferrer': true});
          ga('set', 'anonymizeIp', true);
        }
      } else if(siteSource === 'matomo') {
        if(siteUrl != '') {
          if(typeof _paq === 'undefined') {
            window['_paq'] = [];
            _paq.push(["setDomains", ["*.csudh-primo.hosted.exlibrisgroup.com/"]]);
            _paq.push(["setDoNotTrack", true]);
            (function() {
              _paq.push(['setTrackerUrl', siteUrl+'piwik.php']);
              _paq.push(['setSiteId', siteId]);
              var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
              g.type='text/javascript'; g.async=true; g.defer=true; g.src=siteUrl+'piwik.js'; s.parentNode.insertBefore(g,s);
            })();
          }
        }
      }
    }
    $rootScope.$on('$locationChangeSuccess', function (event, toState, fromState) {
      if(siteSource != '') {
        var documentTitle = defaultTitle;
        var timerStart = Date.now();
        var interval = $interval(function () {
          if(document.title !== '') documentTitle = document.title;
          if (window.location.pathname.indexOf('openurl') !== -1 || window.location.pathname.indexOf('fulldisplay') !== -1)
            if (angular.element(document.querySelector('prm-full-view-service-container .item-title>a')).length === 0) return;
            else documentTitle = angular.element(document.querySelector('prm-full-view-service-container .item-title>a')).text();

          if(siteSource === 'ga') {
            if(typeof ga !== 'undefined') {
              if(fromState != toState) ga('set', 'referrer', fromState);
              ga('set', 'location', toState);
              ga('set', 'title', documentTitle);
              ga('send', 'pageview');
            }
          } else if(siteSource === 'matomo') {
            if(typeof _paq !== 'undefined') {
              if(fromState != toState) _paq.push(['setReferrerUrl', fromState]);
              _paq.push(['setCustomUrl', toState]);
              _paq.push(['setDocumentTitle', documentTitle]);
              _paq.push(['setGenerationTimeMs', Date.now()-timerStart]);
              _paq.push(['enableLinkTracking']);
              _paq.push(['enableHeartBeatTimer']);
              _paq.push(['trackPageView']);
            }
          }
          $interval.cancel(interval);
        }, 0);
      }
    });
  }
});
angular.module('multipleAnalytics').value('analyticsOptionsDefault', {
  enabled: false,
  siteSource: 'ga',
  siteId: '',
  siteUrl: 'https://www.google-analytics.com/analytics.js',
  defaultTitle: 'Discovery Search'
});
