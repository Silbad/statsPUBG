var apiKey = 'YOUR_API_KEY';

$(function() {
    initStatsPUBG();
});

// initialiser l'application
function initStatsPUBG() {

    // version
    var manifest = chrome.runtime.getManifest();
    $('.version').html(manifest.version);

    browser.storage.local.get(['pubgServer', 'pubgListSeasons', 'pubgName', 'pubgSeason', 'pubgMode']).then(function(item) {

        // sélection du serveur
        if (item.pubgServer != undefined) {
            $('#pubg-server').val(item.pubgServer);
        }
        var tmpPubgServer = $('#pubg-server').val();
        browser.storage.local.set({ pubgServer: tmpPubgServer });

        // liste des saisons
        var listSessions = '';
        if (item.pubgListSeasons != undefined) {
            $.each(item.pubgListSeasons.data.reverse(), function(key, value) {
                listSessions += '<option value="' + value.id + '">' + value.id.replace('division.bro.official.', '') + '</option>';
            });
            $('#pubg-season').empty().append(listSessions);
        } else {
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
                    browser.storage.local.set({ pubgListSeasons: result });
                    $.each(result.data.reverse(), function(key, value) {
                        listSessions += '<option value="' + value.id + '">' + value.id.replace('division.bro.official.', '') + '</option>';
                    });
                    $('#pubg-season').empty().append(listSessions);
                    $('.loading').hide();
                },
                error: function(xhr, statut, error){
                    $('.dataPUBG').text('n/a');
                    $('.loading').hide();
                }
            });
        }

        // récupérer les données stockées, sinon prendre celles par défaut et les stocker
        if (item.pubgName != undefined) {
            $('#pubg-name').val(item.pubgName);
            $('#pubg-season').val(item.pubgSeason);
            $('#pubg-mode').val(item.pubgMode);

            // mettre à jour les données
            updateStatsPUBG();
        } else {
            var tmpPubgName = $('#pubg-name').val();
            browser.storage.local.set({ pubgName: tmpPubgName });
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

        // sur modification server
        $('#pubg-server').on('change', function(e) {

            $('.loading').show();

            // mettre à jour la liste des saisons
            var tmpPubgServer = $(this).val();
            browser.storage.local.set({ pubgServer: tmpPubgServer });
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
                    browser.storage.local.set({ pubgListSeasons: result });
                    var listSessions = '';
                    $.each(result.data.reverse(), function(key, value) {
                        listSessions += '<option value="' + value.id + '">' + value.id.replace('division.bro.official.', '') + '</option>';
                    });
                    $('#pubg-season').empty().append(listSessions);
                    var tmpPubgSeason = $('#pubg-season').val();
                    browser.storage.local.set({ pubgSeason: tmpPubgSeason });
                },
                error: function(xhr, statut, error){
                    $('.dataPUBG').text('n/a');
                    $('.loading').hide();
                }
            });

            $('.loading').hide();

            updateStatsPUBG();
        });

        // sur modification nom
        $('#pubg-name').on('blur change', function(e) {
            var tmpPubgName = $(this).val();
            browser.storage.local.set({ pubgName: tmpPubgName });
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
                                $('.damageDealt').text(value.damageDealt);
                                $('.days').text(value.days);
                                $('.headshotKills').text(value.headshotKills);
                                $('.heals').text(value.heals);
                                $('.killPoints').text(value.killPoints);
                                $('.kills').text(value.kills);
                                $('.longestKill').text(value.longestKill);
                                $('.longestTimeSurvived').text(value.longestTimeSurvived);
                                $('.losses').text(value.losses);
                                $('.maxKillStreaks').text(value.maxKillStreaks);
                                $('.mostSurvivalTime').text(value.mostSurvivalTime);
                                $('.revives').text(value.revives);
                                $('.rideDistance').text(value.rideDistance);
                                $('.roadKills').text(value.roadKills);
                                $('.roundMostKills').text(value.roundMostKills);
                                $('.roundsPlayed').text(value.roundsPlayed);
                                $('.suicides').text(value.suicides);
                                $('.teamKills').text(value.teamKills);
                                $('.timeSurvived').text(value.timeSurvived);
                                $('.top10s').text(value.top10s);
                                $('.vehicleDestroys').text(value.vehicleDestroys);
                                $('.walkDistance').text(value.walkDistance);
                                $('.weaponsAcquired').text(value.weaponsAcquired);
                                $('.weeklyKills').text(value.weeklyKills);
                                $('.winPoints').text(value.winPoints);
                                $('.wins').text(value.wins);

                                isData = true;
                                $('.loading').hide();
                            }
                        });
                        if (isData == false) {
                            $('.dataPUBG').text('n/a');
                            $('.loading').hide();
                        }
                    },
                    error: function(xhr, statut, error){
                        $('.dataPUBG').text('n/a');
                        $('.loading').hide();
                    }
                });

            },
            error: function(xhr, statut, error){
                $('.dataPUBG').text('n/a');
                $('.loading').hide();
            }
        });
    } else {
        $('.dataPUBG').text('n/a');
        $('.loading').hide();
    }
}
