module.exports = function setup(options, imports, register) {
    "use strict";

    var serialport = imports.serialport,
        websocket = imports.websocket,

        playingTimeout,
        isOccupied = false,
        gameState = {
            teamOne : {
                smallPoints : 0,
                bigPoints: 0
            },
            teamTwo : {
                smallPoints : 0,
                bigPoints: 0
            }
        },
        eventList = [
            'scoreChanged',
            'tableOccupied',
            'endMatch',
            'newSetStarted',
            'tableExempt'
        ];

    init();

    function init() {
        websocket.on('connection', function(socket) {
            socket.emit('foosballTableConnected', {
                eventList: eventList,
                tableState: getTableState()
            });
        });

        serialport.on('data', function(action) {
            action = data.trim();
            performTableAction(action);

            if(!isOccupied) {
                occupyTable();
            }

            prolongPlaying();
        });
    }

    function performTableAction(action) {
        var tmpTeam;

        switch(action) {

            case "reset":
                resetScore();
                broadcastMessage('scoreChanged', gameState);
                break;

            case "team1":
                tmpTeam = ((gameState.teamOne.bigPoints + gameState.teamTwo.bigPoints) % 2 === 0 ) ? gameState.teamOne : gameState.teamTwo;
                addPoint(tmpTeam);
                break;

            case "team2":
                tmpTeam = ((gameState.teamOne.bigPoints + gameState.teamTwo.bigPoints) % 2 === 0 ) ? gameState.teamTwo : gameState.teamOne;
                addPoint(tmpTeam);
                break;
        }
    }

    function addPoint(team) {
        team.smallPoints++;

        if(team.smallPoints === 5) {
            team.bigPoints++;

            if(team.bigPoints === 3) {
               finishGame();
            } else {
               startNewSet();
            }
        } else {
            broadcastMessage('scoreChanged');
        }
    }

    function finishGame() {
        broadcastMessage('endMatch');
        resetScore();
    }

    function resetScore() {
        gameState.teamOne.smallPoints = 0;
        gameState.teamOne.bigPoints = 0;
        gameState.teamTwo.smallPoints = 0;
        gameState.teamTwo.bigPoints = 0;
    }

    function startNewSet() {
        gameState.teamOne.smallPoints = 0;
        gameState.teamTwo.smallPoints = 0;
        broadcastMessage('newSetStarted');
    }

    function occupyTable() {
        isOccupied = true;
        broadcastMessage('tableOccupied');
    }

    function exemptTable() {
        isOccupied = false;
        resetScore();
        broadcastMessage('tableExempt');
    }

    function prolongPlaying() {
            clearTimeout(playingTimeout);
            playingTimeout = setTimeout(exemptTable, 60000);
    }

    function broadcastMessage(message) {
        websocket.emit(message, getTableState());
    }

    function getTableState() {
        return {
            isOccupied: isOccupied,
            game: gameState
        }
    }

    register(null, {});
};