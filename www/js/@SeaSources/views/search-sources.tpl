<div class="row">

    <div class="">
        <!--<button class="btn btn-flagy-rev btn-blue fullsize toform"><%= Resources.toform %></button>-->
    </div>

    <div class="">

        <div class="text-center">
            <div id="source-select-meter" data-meter data-meter-min="0" data-meter-val="0"></div>
            <div class="text-left">
                <%= Resources.selSources %>: <span id="selected-num">0</span>
                <br /><%= Resources.sum %>: <span id="select-amount">0.00</span>&nbsp;<span class="Currency"></span>
                <br /><%= Resources.balance %>: <span class="text-info">
                    <span id="balance">0</span>&nbsp;<span class="Currency"></span>
                </span>
            </div>
        </div>
    </div>

    <div class="">
        <!--<button class="btn btn-flagy btn-blue fullsize start disabled"><%= Resources.saveCollRobots %></button>-->
    </div>
</div>

<div class="row">
    <div id="Filters" class="grid--1-4"></div>
    <div id="ListTemplate" style="margin-left:30%;"></div>
</div>

