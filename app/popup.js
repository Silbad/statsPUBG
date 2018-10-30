'use strict';
var apiKey = config.API_KEY;

// init statsPUBG
$(function() {
    initStatsPUBG();
});

// charger une erreur
function loadError(error) {
    $('.dataPUBG').text('n/a');
    $('.loading').hide();
    clearTimeout();
    switch(error) {
        case 'Not Found':
            error = 'Data not found, please change parameters.'
            break;
        case 'No Reason Phrase':
            error = 'Too many requests, please wait a minute.'
            break;
        default:
            error = 'No data available.'
    }
    $('.too-requests').html('<i class="fa fa-exclamation-triangle"></i> ' + error).show();
    var tmpError = setTimeout(function(){
        $('.too-requests').hide();
    }, 5000);
}

// mettre à jour la liste des saisons
function updateListSeasons(tmpPubgServer) {
    $('.loading').show();
    $.ajax({
        method: 'GET',
        url: 'https://api.playbattlegrounds.com/shards/' + tmpPubgServer + '/seasons',
        headers: {
            Accept: 'application/vnd.api+json'
        },
        beforeSend: function (auth) {
            auth.setRequestHeader('Authorization', 'Bearer ' + apiKey);
        },
        success: function(result, statut, xhr) {
            // charger et enregistrer la liste des saisons
            browser.storage.local.set({ pubgListSeasons: result });
            var listSessions = '';
            $.each(result.data.reverse(), function(key, value) {
                listSessions += '<option value="' + value.id + '">' + value.id.replace('division.bro.official.', '') + '</option>';
            });
            $('#pubg-season').empty().append(listSessions);
            // sauvegarder la saison par défaut
            var tmpPubgSeason = $('#pubg-season').val();
            browser.storage.local.set({ pubgSeason: tmpPubgSeason });
            // sauvegarder la date de mise à jour
            var tmpSaisonUpdate = new Date();
            browser.storage.local.set({ pubgSaisonUpdate: tmpSaisonUpdate });
        },
        error: function(xhr, statut, error){
            loadError(error);
        }
    });
    $('.loading').hide();
}

// initialiser l'application
function initStatsPUBG() {

    // version
    var manifest = chrome.runtime.getManifest();
    $('.version').html(manifest.version);

    // récupérer les données
    browser.storage.local.get(['pubgName', 'pubgServer', 'pubgSaisonUpdate', 'pubgListSeasons', 'pubgSeason', 'pubgMode']).then(function(item) {

        // récupérer l'ID du serveur
        var tmpPubgServer = $('#pubg-server').val();
        if (item.pubgServer != null) {
            tmpPubgServer = item.pubgServer
        }
        browser.storage.local.set({ pubgServer: tmpPubgServer });

        // mettre à jour la liste des saisons une fois par mois
        if (item.pubgListSeasons != null) {
            // vérifier la cohérence d'une mise à jour de la liste des saisons
            var tmpPubgServerUpdate = item.pubgSaisonUpdate;
            if (tmpPubgServerUpdate == null) {
                tmpPubgServerUpdate = new Date();
            }
            var tmpNow = new Date();
            var tmpDay = tmpNow.getDate();
            var timeDiff = Math.abs(tmpNow.getTime() - tmpPubgServerUpdate.getTime());
            var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

            // si la date est comprise entre le 1 et le 5
            if ((tmpDay > 0) && (tmpDay < 6) && (diffDays > 5)) {
                updateListSeasons(tmpPubgServer);
            } else {
                // si mise à jour vieille de plus de 28 jours, on met à jour
                if (diffDays > 15) {
                    updateListSeasons(tmpPubgServer);
                // si liste à jour on la charge normalement
                } else {
                    var listSessions = item.pubgListSeasons;
                    $.each(listSessions.data.reverse(), function(key, value) {
                        listSessions += '<option value="' + value.id + '">' + value.id.replace('division.bro.official.', '') + '</option>';
                    });
                    $('#pubg-season').empty().append(listSessions);
                }
            }
        } else {
            updateListSeasons(tmpPubgServer);
        }

        // récupérer les données stockées, sinon prendre celles par défaut et les stocker
        if (item.pubgName != undefined) {
            $('#pubg-name').val(item.pubgName);
            $('#pubg-server').val(item.pubgServer);
            $('#pubg-season').val(item.pubgSeason);
            $('#pubg-mode').val(item.pubgMode);

            // mettre à jour les données
            updateStatsPUBG();
        } else {
            var tmpPubgName = $('#pubg-name').val();
            browser.storage.local.set({ pubgName: tmpPubgName });
            var tmpPubgServer = $('#pubg-server').val();
            browser.storage.local.set({ pubgServer: tmpPubgServer });
            var tmpPubgSeason = $('#pubg-season').val();
            browser.storage.local.set({ pubgSeason: tmpPubgSeason });
            var tmpPubgMode = $('#pubg-mode').val();
            browser.storage.local.set({ pubgMode: tmpPubgMode });
        }

        // EVENTS -----------------------------------------------------------------------------------

        // sur bouton refresh
        $('.btn-refresh').on('click', function(e) {
            // mettre à jour les données
            updateStatsPUBG();
        });

        // sur modification nom
        $('#pubg-name').on('blur change', function(e) {
            var tmpPubgName = $(this).val();
            browser.storage.local.set({ pubgName: tmpPubgName });
            updateStatsPUBG();
        });

        // sur modification server
        $('#pubg-server').on('change', function(e) {
            var tmpPubgServer = $(this).val();
            browser.storage.local.set({ pubgServer: tmpPubgServer });
            updateListSeasons(tmpPubgServer);
            updateStatsPUBG();
        });

        // sur modification saison
        $('#pubg-season').on('change', function(e) {
            var tmpPubgSeason = $(this).val();
            browser.storage.local.set({ pubgSeason: tmpPubgSeason });
            updateStatsPUBG();
        });

        // sur modification mode
        $('#pubg-mode').on('change', function(e) {
            var tmpPubgMode = $(this).val();
            browser.storage.local.set({ pubgMode: tmpPubgMode });
            updateStatsPUBG();
        });
    });
}

function updateStatsPUBG() {

    $('.loading').show();

    var tmpPubgName = $('#pubg-name').val();
    if (tmpPubgName == null) {tmpPubgName = ''};
    var tmpPubgServer = $('#pubg-server').val();
    if (tmpPubgServer == null) {tmpPubgServer = ''};
    var tmpPubgSeason = $('#pubg-season').val();
    if (tmpPubgSeason == null) {tmpPubgSeason = ''};
    var tmpPubgMode = $('#pubg-mode').val();
    if (tmpPubgMode == null) {tmpPubgMode = ''};

    // tester si le nom est saisi
    if((tmpPubgName.trim() != '') && (tmpPubgServer.trim() != '') && (tmpPubgSeason.trim() != '') && (tmpPubgMode.trim() != '')) {

        $.ajax({
            method: 'GET',
            async: false,
            url: 'https://api.playbattlegrounds.com/shards/' + tmpPubgServer + '/players?filter[playerNames]=' + tmpPubgName,
            headers: {
                Accept: 'application/vnd.api+json'
            },
            beforeSend: function (auth) {
                auth.setRequestHeader('Authorization', 'Bearer ' + apiKey);
            },
            success: function(result, statut, xhr) {
                var tmpPubgId = result.data[0].id;

                $.ajax({
                    method: 'GET',
                    async: false,
                    url: 'https://api.playbattlegrounds.com/shards/' + tmpPubgServer + '/players/' + tmpPubgId + '/seasons/' + tmpPubgSeason,
                    headers: {
                        Accept: 'application/vnd.api+json'
                    },
                    beforeSend: function (auth) {
                        auth.setRequestHeader('Authorization', 'Bearer ' + apiKey);
                    },
                    success: function(result, statut, xhr) {
                        var isData = false;
                        $.each(result.data.attributes.gameModeStats, function(key, value) {
                            if (key == tmpPubgMode) {
                                // mettre à jour les données
                                $('.assists').text(value.assists);
                                $('.boosts').text(value.boosts);
                                $('.dBNOs').text(value.dBNOs);
                                $('.dailyKills').text(value.dailyKills);
                                $('.damageDealt').text(parseInt(value.damageDealt));
                                $('.days').text(value.days);
                                $('.headshotKills').text(value.headshotKills);
                                $('.heals').text(value.heals);
                                $('.killPoints').text(value.killPoints);
                                $('.kills').text(value.kills);
                                var tmpLongestKill = parseFloat(value.longestKill).toFixed(2);
                                $('.longestKill').text(tmpLongestKill + ' m');
                                var tmpLongestTimeSurvived = parseInt(value.longestTimeSurvived / 60);
                                $('.longestTimeSurvived').text(tmpLongestTimeSurvived + ' min');
                                $('.losses').text(value.losses);
                                $('.maxKillStreaks').text(value.maxKillStreaks);
                                var tmpMostSurvivalTime = parseInt(value.mostSurvivalTime / 60);
                                $('.mostSurvivalTime').text(tmpMostSurvivalTime + ' min');
                                $('.revives').text(value.revives);
                                var tmpRideDistance = parseFloat(value.rideDistance / 1000).toFixed(2);
                                $('.rideDistance').text(tmpRideDistance + ' km');
                                $('.roadKills').text(value.roadKills);
                                $('.roundMostKills').text(value.roundMostKills);
                                $('.roundsPlayed').text(value.roundsPlayed);
                                $('.suicides').text(value.suicides);
                                $('.teamKills').text(value.teamKills);
                                var tmpTimeSurvived = parseInt(value.timeSurvived / 60);
                                $('.timeSurvived').text(tmpTimeSurvived + ' min');
                                $('.top10s').text(value.top10s);
                                $('.vehicleDestroys').text(value.vehicleDestroys);
                                var tmpWalkDistance = parseFloat(value.walkDistance / 1000).toFixed(2);
                                $('.walkDistance').text(tmpWalkDistance + ' km');
                                $('.weaponsAcquired').text(value.weaponsAcquired);
                                $('.weeklyKills').text(value.weeklyKills);
                                $('.winPoints').text(value.winPoints);
                                $('.wins').text(value.wins);
                                $('.bestRankPoint').text(value.bestRankPoint);
                                $('.dailyWins').text(value.dailyWins);
                                $('.rankPoints').text(value.rankPoints);
                                var tmpSwimDistance = parseFloat(value.swimDistance / 1000).toFixed(2);
                                $('.swimDistance').text(tmpSwimDistance + ' km');

                                isData = true;
                                $('.loading').hide();
                            }
                        });
                        if (isData == false) {
                            loadError();
                        }
                    },
                    error: function(xhr, statut, error){
                        loadError(error);
                    }
                });
            },
            error: function(xhr, statut, error){
                loadError(error);
            }
        });
    } else {
        loadError();
    }
}
