/* 	demo.js http://github.com/bgrins/javascript-astar
    MIT License
    
    Set up the demo page for the A* Search
*/
var json_str, rootNode = "<b>Passos:<b><br><br> S", passos = [], score = 0, totpassos = 0;
var reader;
var lines = [];
var saida;
window.log = function () {
    if (this.console) {
        //console.log( Array.prototype.slice.call(arguments) );
    }
};
function createCookie(name, value, days) {
    var expires;
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toGMTString();
    }
    else {
        expires = "";
    }
    document.cookie = name + "=" + value + expires + "; path=/";
}
function getCookie(c_name) {
    if (document.cookie.length > 0) {
        var c_start, c_end;
        c_start = document.cookie.indexOf(c_name + "=");
        if (c_start != -1) {
            c_start = c_start + c_name.length + 1;
            c_end = document.cookie.indexOf(";", c_start);
            if (c_end == -1) {
                c_end = document.cookie.length;
            }
            return unescape(document.cookie.substring(c_start, c_end));
        }
    }
    return "";
}
$(function () {
    var $grid = $("#search_grid");
    var $selectWallFrequency = $("#selectWallFrequency");
    var $selectGridSize = $("#selectGridSize");
    var $checkDebug = $("#checkDebug");
    var $searchDiagonal = $("#searchDiagonal");
    var opts = {
        wallFrequency: $selectWallFrequency.val(),
        gridSize: $selectGridSize.val(),
        debug: $checkDebug.is("checked"),
        diagonal: $searchDiagonal.is("checked")
    };
    var grid = new GraphSearch($grid, opts, astar.AStar.search);
    $("#$chart").change(function () {
        grid.initialize();
    });
    $("#generateWeights").click(function () {
        if ($("#generateWeights").prop("checked")) {
            $('#weightsKey').slideDown();
        }
        else {
            $('#weightsKey').slideUp();
        }
    });
});
var css = { start: "start", finish: "finish", wall: "wall", active: "active", queijo: "queijo" };
function GraphSearch($graph, options, implementation) {
    this.$graph = $graph;
    this.search = implementation;
    var json_str = getCookie('mycookie');
    lines = JSON.parse(json_str);
    lines.shift();
    // tamanho =  > lines[0].length ? lines.length : lines[0].length;
    // console.log("tamanho do labirinto"+tamanho);
    this.opts = $.extend({ wallFrequency: .1, debug: true, gridSize: lines[0].length }, options);
    this.initialize();
    this.cellClicked(saida);
}
GraphSearch.prototype.setOption = function (opt) {
    this.opts = $.extend(this.opts, opt);
    if (opt["debug"] || opt["debug"] == false) {
        this.drawDebugInfo(opt["debug"]);
    }
};
GraphSearch.prototype.initialize = function () {
    var self = this;
    this.grid = [];
    var nodes = [];
    var $graph = this.$graph;
    $graph.empty();
    var json_str = getCookie('mycookie');
    lines = JSON.parse(json_str);
    lines.shift();
    console.log(lines);
    var cellWidth = ($graph.width() / this.opts.gridSize) - 2; // -2 for border
    var cellHeight = ($graph.height() / this.opts.gridSize) - 2;
    var $cellTemplate = $("<span />").addClass("grid_item").width(cellWidth).height(cellHeight);
    var startSet = false;
    for (var x = 0; lines[x]; x++) {
        var $row = $("<div class='clear' />");
        var nodeRow = [];
        var gridRow = [];
        //y<this.opts.gridSize
        for (var y = 0; lines[x][y]; y++) {
            var id = "cell_" + x + "_" + y;
            var $cell = $cellTemplate.clone();
            var isWall = 1;
            $cell.attr("id", id).attr("x", x).attr("y", y);
            $row.append($cell);
            gridRow.push($cell);
            if (lines[x][y] == "Q")
                $cell.addClass(css.queijo);
            if (lines[x][y] != "#")
                isWall = 0;
            if (isWall == 1) {
                nodeRow.push(astar.GraphNodeType.WALL);
                $cell.addClass(css.wall);
            }
            else {
                var cell_weight = ($("#generateWeights").prop("checked") ? (Math.floor(Math.random() * 3)) * 2 + 1 : 1);
                nodeRow.push(cell_weight);
                $cell.addClass('weight' + cell_weight);
                if ($("#displayWeights").prop("checked")) {
                    $cell.html(cell_weight);
                }
                ;
                //if (!startSet) 
                if (lines[x][y] == "R") {
                    $cell.addClass(css.start);
                    startSet = true;
                }
                else if (lines[x][y] == "S") {
                    $cell.addClass(css.finish);
                    saida = $cell;
                }
            }
        }
        $graph.append($row);
        this.grid.push(gridRow);
        nodes.push(nodeRow);
    }
    //PREENCHE O ESPACO FALTANTE {para garantir que nao ha espacos extra no labirinto}
    isWall = 1;
    for (x; x < this.opts.gridSize; x++) {
        for (y; y < this.opts.gridSize; y++) {
            $cell.attr("id", id).attr("x", x).attr("y", y);
            $row.append($cell);
            gridRow.push($cell);
            nodeRow.push(astar.GraphNodeType.WALL);
            $cell.addClass(css.wall);
        }
        $graph.append($row);
        this.grid.push(gridRow);
        nodes.push(nodeRow);
    }
    this.graph = new astar.Graph(nodes);
    // bind cell event, set start/wall positions
    this.$cells = $graph.find(".grid_item");
    //this.$cells.click(function() { self.cellClicked($(this)) });
};
GraphSearch.prototype.cellClicked = function ($end) {
    var end = this.nodeFromElement($end);
    if ($end.hasClass(css.wall) || $end.hasClass(css.start)) {
        log("clicked on wall or start...", $end);
        return;
    }
    this.$cells.removeClass(css.finish);
    $end.addClass("finish");
    var $start = this.$cells.filter("." + css.start);
    var start = this.nodeFromElement($start);
    var el = document.getElementById('chart');
    var sTime = new Date();
    var path = this.search(this.graph.nodes, start, end, this.opts.diagonal);
    var fTime = new Date();
    if (!path || path.length == 0) {
        $("#message").text("couldn't find a path (" + (fTime - sTime) + "ms)");
        this.animateNoPath();
    }
    else {
        $("#message").text("search took " + (fTime - sTime) + "ms.");
        if (this.opts.debug) {
            this.drawDebugInfo(this.opts.debug);
        }
        var el = document.getElementById('chart');
        el.innerHTML = "";
        score = 0;
        this.animatePath(path);
    }
};
GraphSearch.prototype.drawDebugInfo = function (show) {
    this.$cells.html(" ");
    var that = this;
    if (show) {
        that.$cells.each(function (i) {
            var node = that.nodeFromElement($(this));
            var debug = false;
            if (node.visited) {
                debug = "F: " + node.f + "<br />G: " + node.g + "<br />H: " + node.h;
            }
            if (debug) {
                $(this).html(debug);
            }
        });
    }
};
GraphSearch.prototype.nodeFromElement = function ($cell) {
    return this.graph.nodes[parseInt($cell.attr("x"))][parseInt($cell.attr("y"))];
};
GraphSearch.prototype.animateNoPath = function () {
    var $graph = this.$graph;
    var jiggle = function (lim, i) {
        if (i >= lim) {
            $graph.css("top", 0).css("left", 0);
            return;
        }
        if (!i)
            i = 0;
        i++;
        $graph.css("top", Math.random() * 6).css("left", Math.random() * 6);
        setTimeout(function () { jiggle(lim, i); }, 5);
    };
    jiggle(15);
};
GraphSearch.prototype.animatePath = function (path) {
    var grid = this.grid;
    var timeout = 1000 / grid.length;
    var el = document.getElementById('chart');
    var scoreBox = document.getElementById('score-box-queijos');
    var scoreBoxPassos = document.getElementById('score-box-passos');
    var elementFromNode = function (node) {
        passos.push("" + node.pos.x + ", " + node.pos.y);
        el.innerHTML += rootNode + "(" + node.pos.x + ", " + node.pos.y + ")<br>";
        if (lines[node.pos.x][node.pos.y] == "Q") {
            score += 1;
            scoreBox.innerHTML = score;
            console.log("Queijo");
            var player = document.createElement('audio');
            player.src = 'https://dl.dropbox.com/u/7079101/coin.mp3';
            player.preload = 'auto';
            for (var i = 0; i <= 10; i++) {
                if (i === 0) {
                    // Play a sound when i === 10
                    player.play();
                }
                else {
                    console.log('Not yet!');
                }
            }
        }
        totpassos += 1;
        scoreBoxPassos.innerHTML = totpassos;
        rootNode = node.pos.x + ", " + node.pos.y;
        return grid[node.pos.x][node.pos.y];
    };
    var addClass = function (path, i) {
        if (i >= path.length) {
        }
        elementFromNode(path[i]).addClass(css.active);
        setTimeout(function () { addClass(path, i + 1); }, timeout * path[i].cost);
    };
    addClass(path, 0);
};
var astar;
(function (astar_1) {
    var GraphNodeType;
    (function (GraphNodeType) {
        GraphNodeType[GraphNodeType["WALL"] = 0] = "WALL";
        GraphNodeType[GraphNodeType["OPEN"] = 1] = "OPEN";
    })(GraphNodeType = astar_1.GraphNodeType || (astar_1.GraphNodeType = {}));
    var Graph = (function () {
        function Graph(grid) {
            this.elements = grid;
            var nodes = [];
            var row, rowLength, len = grid.length;
            for (var x = 0; x < len; ++x) {
                row = grid[x];
                rowLength = row.length;
                nodes[x] = new Array(rowLength); // optimum array with size
                for (var y = 0; y < rowLength; ++y) {
                    nodes[x][y] = new GraphNode(x, y, row[y]);
                }
            }
            this.nodes = nodes;
        }
        Graph.prototype.toString = function () {
            var graphString = "\n";
            var nodes = this.nodes;
            var rowDebug, row, y, l;
            for (var x = 0, len = nodes.length; x < len;) {
                rowDebug = "";
                row = nodes[x++];
                for (y = 0, l = row.length; y < l;) {
                    rowDebug += row[y++].type + " ";
                }
                graphString = graphString + rowDebug + "\n";
            }
            return graphString;
        };
        return Graph;
    }());
    astar_1.Graph = Graph;
    var GraphNode = (function () {
        function GraphNode(x, y, type) {
            this.data = {};
            this.x = x;
            this.y = y;
            this.pos = { x: x, y: y };
            this.type = type;
        }
        GraphNode.prototype.toString = function () {
            return "[" + this.x + " " + this.y + "]";
        };
        GraphNode.prototype.isWall = function () {
            return this.type == GraphNodeType.WALL;
        };
        return GraphNode;
    }());
    astar_1.GraphNode = GraphNode;
    var BinaryHeap = (function () {
        function BinaryHeap(scoreFunction) {
            this.content = [];
            this.scoreFunction = scoreFunction;
        }
        BinaryHeap.prototype.push = function (node) {
            // Add the new node to the end of the array.
            this.content.push(node);
            // Allow it to sink down.
            this.sinkDown(this.content.length - 1);
        };
        BinaryHeap.prototype.pop = function () {
            // Store the first node so we can return it later.
            var result = this.content[0];
            // Get the node at the end of the array.
            var end = this.content.pop();
            // If there are any elements left, put the end node at the
            // start, and let it bubble up.
            if (this.content.length > 0) {
                this.content[0] = end;
                this.bubbleUp(0);
            }
            return result;
        };
        BinaryHeap.prototype.remove = function (node) {
            var i = this.content.indexOf(node);
            // When it is found, the process seen in 'pop' is repeated
            // to fill up the hole.
            var end = this.content.pop();
            if (i !== this.content.length - 1) {
                this.content[i] = end;
                if (this.scoreFunction(end) < this.scoreFunction(node))
                    this.sinkDown(i);
                else
                    this.bubbleUp(i);
            }
        };
        BinaryHeap.prototype.size = function () {
            return this.content.length;
        };
        BinaryHeap.prototype.rescoreElement = function (node) {
            this.sinkDown(this.content.indexOf(node));
        };
        BinaryHeap.prototype.sinkDown = function (n) {
            // Fetch the element that has to be sunk.
            var element = this.content[n];
            // When at 0, an element can not sink any further.
            while (n > 0) {
                // Compute the parent element's index, and fetch it.
                var parentN = ((n + 1) >> 1) - 1, parent = this.content[parentN];
                // Swap the elements if the parent is greater.
                if (this.scoreFunction(element) < this.scoreFunction(parent)) {
                    this.content[parentN] = element;
                    this.content[n] = parent;
                    // Update 'n' to continue at the new position.
                    n = parentN;
                }
                else {
                    break;
                }
            }
        };
        BinaryHeap.prototype.bubbleUp = function (n) {
            // Look up the target element and its score.
            var length = this.content.length, element = this.content[n], elemScore = this.scoreFunction(element);
            while (true) {
                // Compute the indices of the child elements.
                var child2N = (n + 1) << 1, child1N = child2N - 1;
                // This is used to store the new position of the element,
                // if any.
                var swap = null;
                // If the first child exists (is inside the array)...
                if (child1N < length) {
                    // Look it up and compute its score.
                    var child1 = this.content[child1N], child1Score = this.scoreFunction(child1);
                    // If the score is less than our element's, we need to swap.
                    if (child1Score < elemScore)
                        swap = child1N;
                }
                // Do the same checks for the other child.
                if (child2N < length) {
                    var child2 = this.content[child2N], child2Score = this.scoreFunction(child2);
                    if (child2Score < (swap === null ? elemScore : child1Score))
                        swap = child2N;
                }
                // If the element needs to be moved, swap it, and continue.
                if (swap !== null) {
                    this.content[n] = this.content[swap];
                    this.content[swap] = element;
                    n = swap;
                }
                else {
                    break;
                }
            }
        };
        return BinaryHeap;
    }());
    astar_1.BinaryHeap = BinaryHeap;
    var AStar = (function () {
        function AStar(grid, disablePoints, enableCost) {
            this.grid = [];
            for (var x = 0, xl = grid.length; x < xl; x++) {
                this.grid[x] = [];
                for (var y = 0, yl = grid[x].length; y < yl; y++) {
                    var cost = (typeof grid[x][y] == "number") ? grid[x][y] : grid[x][y].type;
                    if (cost > 1 && !enableCost)
                        cost = 1;
                    this.grid[x][y] = {
                        org: grid[x][y],
                        f: 0,
                        g: 0,
                        h: 0,
                        cost: cost,
                        visited: false,
                        closed: false,
                        pos: {
                            x: x,
                            y: y
                        },
                        parent: null
                    };
                }
            }
            if (disablePoints !== undefined) {
                for (var i = 0; i < disablePoints.length; i++)
                    this.grid[disablePoints[i].x][disablePoints[i].y].cost = 0;
            }
        }
        AStar.prototype.heap = function () {
            return new BinaryHeap(function (node) {
                return node.f;
            });
        };
        AStar.prototype._find = function (org) {
            for (var x = 0; x < this.grid.length; x++)
                for (var y = 0; y < this.grid[x].length; y++)
                    if (this.grid[x][y].org == org)
                        return this.grid[x][y];
        };
        AStar.prototype._search = function (start, end, diagonal, heuristic) {
            heuristic = heuristic || this.manhattan;
            diagonal = !!diagonal;
            var openHeap = this.heap();
            var _start, _end;
            if (start.x !== undefined && start.y !== undefined)
                _start = this.grid[start.x][start.y];
            else
                _start = this._find(start);
            if (end.x !== undefined && end.y !== undefined)
                _end = this.grid[end.x][end.y];
            else
                _end = this._find(end);
            if (AStar.NO_CHECK_START_POINT == false && _start.cost <= 0)
                return [];
            openHeap.push(_start);
            while (openHeap.size() > 0) {
                // Grab the lowest f(x) to process next.  Heap keeps this sorted for us.
                var currentNode = openHeap.pop();
                // End case -- result has been found, return the traced path.
                if (currentNode === _end) {
                    var curr = currentNode;
                    var ret = [];
                    while (curr.parent) {
                        ret.push(curr);
                        curr = curr.parent;
                    }
                    return ret.reverse();
                }
                // Normal case -- move currentNode from open to closed, process each of its neighbors.
                currentNode.closed = true;
                // Find all neighbors for the current node. Optionally find diagonal neighbors as well (false by default).
                var neighbors = this.neighbors(currentNode, diagonal);
                for (var i = 0, il = neighbors.length; i < il; i++) {
                    var neighbor = neighbors[i];
                    if (neighbor.closed || neighbor.cost <= 0) {
                        // Not a valid node to process, skip to next neighbor.
                        continue;
                    }
                    // The g score is the shortest distance from start to current node.
                    // We need to check if the path we have arrived at this neighbor is the shortest one we have seen yet.
                    var gScore = currentNode.g + neighbor.cost;
                    var beenVisited = neighbor.visited;
                    if (!beenVisited || gScore < neighbor.g) {
                        // Found an optimal (so far) path to this node.  Take score for node to see how good it is.
                        neighbor.visited = true;
                        neighbor.parent = currentNode;
                        neighbor.h = neighbor.h || heuristic(neighbor.pos, _end.pos);
                        neighbor.g = gScore;
                        neighbor.f = neighbor.g + neighbor.h;
                        if (!beenVisited) {
                            // Pushing to heap will put it in proper place based on the 'f' value.
                            openHeap.push(neighbor);
                        }
                        else {
                            // Already seen the node, but since it has been rescored we need to reorder it in the heap
                            openHeap.rescoreElement(neighbor);
                        }
                    }
                }
            }
            // No result was found - empty array signifies failure to find path.
            return [];
        };
        AStar.search = function (grid, start, end, disablePoints, diagonal, heuristic) {
            var astar = new AStar(grid, disablePoints);
            return astar._search(start, end, diagonal, heuristic);
        };
        AStar.prototype.manhattan = function (pos0, pos1) {
            // See list of heuristics: http://theory.stanford.edu/~amitp/GameProgramming/Heuristics.html
            var d1 = Math.abs(pos1.x - pos0.x);
            var d2 = Math.abs(pos1.y - pos0.y);
            return d1 + d2;
        };
        AStar.prototype.neighbors = function (node, diagonals) {
            var grid = this.grid;
            var ret = [];
            var x = node.pos.x;
            var y = node.pos.y;
            // West
            if (grid[x - 1] && grid[x - 1][y]) {
                ret.push(grid[x - 1][y]);
            }
            // East
            if (grid[x + 1] && grid[x + 1][y]) {
                ret.push(grid[x + 1][y]);
            }
            // South
            if (grid[x] && grid[x][y - 1]) {
                ret.push(grid[x][y - 1]);
            }
            // North
            if (grid[x] && grid[x][y + 1]) {
                ret.push(grid[x][y + 1]);
            }
            if (diagonals) {
                // Southwest
                if (grid[x - 1] && grid[x - 1][y - 1]) {
                    ret.push(grid[x - 1][y - 1]);
                }
                // Southeast
                if (grid[x + 1] && grid[x + 1][y - 1]) {
                    ret.push(grid[x + 1][y - 1]);
                }
                // Northwest
                if (grid[x - 1] && grid[x - 1][y + 1]) {
                    ret.push(grid[x - 1][y + 1]);
                }
                // Northeast
                if (grid[x + 1] && grid[x + 1][y + 1]) {
                    ret.push(grid[x + 1][y + 1]);
                }
            }
            return ret;
        };
        return AStar;
    }());
    AStar.NO_CHECK_START_POINT = false;
    astar_1.AStar = AStar;
})(astar || (astar = {}));
function checkFileAPI() {
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        reader = new FileReader();
        return true;
    }
    else {
        alert('The File APIs are not fully supported by your browser. Fallback required.');
        return false;
    }
}
/**
 * read text input
 */
function readText(filePath) {
    var output = ""; //placeholder for text output
    if (filePath.files && filePath.files[0]) {
        reader.onload = function (e) {
            output = e.target.result;
            displayContents(output);
        }; //end onload()
        reader.readAsText(filePath.files[0]);
    } //end if html5 filelist support
    else if (ActiveXObject && filePath) {
        try {
            reader = new ActiveXObject("Scripting.FileSystemObject");
            var file = reader.OpenTextFile(filePath, 1); //ActiveX File Object
            output = file.ReadAll(); //text contents of file
            file.Close(); //close file "input stream"
            displayContents(convertToNumbers(output));
        }
        catch (e) {
            if (e.number == -2146827859) {
                alert('Unable to access local files due to browser security settings. ' +
                    'To overcome this, go to Tools->Internet Options->Security->Custom Level. ' +
                    'Find the setting for "Initialize and script ActiveX controls not marked as safe" and change it to "Enable" or "Prompt"');
            }
        }
    }
    else {
        return false;
    }
    return true;
}
function convertToNumbers(output) {
    // &colon;&rpar;
    output = output;
    return output;
}
/**
 * display content using a basic HTML replacement
 */
function displayContents(txt) {
    var n;
    var el = document.getElementById('chart');
    lines = txt.split("\n");
    el.innerHTML = "";
    for (var i = 0; lines[i]; i++) {
        if (i > 0) {
            //  lines[1] = lines[i].split('');//remove o espaco inserto automaticamente pelo browser
            n = lines[i].replace(/ /g, ''); //.split('');
            lines[i] = Array.from(n); //n.charAt(n.length - 1) + n.substring(0, n.length - 1)); //.join();
        }
        json_str = JSON.stringify(lines);
        createCookie('mycookie', json_str);
        //Later on, to retrieve the cookie's contents as an array:
        el.innerHTML += lines[i] + "<br>";
    }
}
