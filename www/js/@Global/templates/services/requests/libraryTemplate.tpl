<script type="x-template/underscore" id="request-library-template">
    <div class="g-dialog--wrapper full" style="display:block;">
        <div class="g-dialog--header" data-icon="icon-folder"><%= Resources.titleReqLib %><i class="close"></i></div>
        <div class="g-dialog--manage">
            <span>
                <span class="notice"><%= Resources.noticereqempty %></span>
            </span>
        </div>
        <div class="g-dialog--content">
            <div class="g-dialog--container hassidebbar">
                <div class="g-dialog--sidebar">
                    <div class="g-dialog--toolbar">
                        <ul>
                            <li>
                                <span class="g-form--input find">
                                    <input type="text" value="" class="g-form--input" />
                                    <i class="search rtl-1"></i>
                                </span>
                            </li>
                        </ul>
                    </div>
                    <div class="left"></div>
                </div>
                <div class="g-dialog--main">
                    <div class="params"></div>
                    <div class="result"></div>
                </div>
            </div>
            <div class="g-dialog--controls">
                <button class="g-form--button blue cancel"><%= Resources.cancel %></button>
                <button class="g-form--button blue right addrequest"><%= Resources.add %></button>
            </div>
            <div class="authorise-block">
                <div class="anbr-head"><svg class="svg-icon icon-close"><use xlink:href="#icon-close"></use></svg><span>&nbsp;</span></div>
                <div class="bum"></div>
            </div>
        </div>
    </div>
    <!--
    <h2><%= Resources.titleReqLib %></h2>
    <div class="toolsbar">
        <div class="notice"><%= Resources.noticereqempty %></div>
        <span class="find">
            <span class="font-icon font-icon-find"></span><input type="text" name="find" />
            <span class="font-icon font-icon-cancel"></span>
        </span>
    </div><div class="left"></div><div class="right">
        <div class="font-icon font-icon-sleft"></div><div class="notice"><%= Resources.noticeselparam %></div>
        <div class="params"></div><div class="result"></div>
    </div><div class="bottom">
        <div class="panel">
            <div class="w"></div>
        </div><div class="connect">
            <svg><use xlink:href="#icon-data-base" /></svg>
            <span><%= Resources.stcon %></span>
        </div><button class="btn btn-mid btn-grey cancel"><%= Resources.cancel %></button>&nbsp;&nbsp;
        <button class="btn btn-mid btn-blue addrequest"><%= Resources.add %></button>
    </div>
    <div class="authorise-block">
        <div class="anbr-head"><svg class="svg-icon icon-close"><use xlink:href="#icon-close"></use></svg><span>&nbsp;</span></div>
        <div class="bum"></div>
    </div>
    -->
</script>