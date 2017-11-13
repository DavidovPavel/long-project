<div class="sys-role-interface">
    <div class="list-cmd-panel"></div>
    <select name="ProjectRole_ID"></select>
</div>

    <% if(RelationsDescriptionData){ %>
    <div class="relations-data">
        <div class="for-card">
            <div class="form-group">
                <div class="input-group">
                    <input type="text" class="form-control" id="add-role" placeholder="<%= Resources.pinfo %>">
                    <div class="input-group-addon add-btn"><%= Resources.add %></div>
                </div>
            </div>
            <span class="list-sources"></span>
        </div>
    </div>
    <% } %>

<div class="row object-card">

    <div class="col-md-6 left">

        <div class="row"><label><%= Resources.nameofcompany %>:</label><b><%= title_INTERN %></b></div>

        <div class="row"><label><%= Resources.searchwiththesynonyms %>:</label><b><%= searchSin_INTERN?(Resources.on+" "+ Resources.synonims + ": "+synonyms_INTERN.length):("<i>"+Resources.off+"</i>") %></b></div>

        <div class="synonimus"></div>

    </div>

    <div class="col-md-6 right">
        <div class="row"><label><%= Resources.country %>:</label><b><%= Resources[selectedCountries[0]] %></b></div>
        <div class="Country" id="ru-RU">
            <div class="row"><label><%= Resources.inn %>:</label><b><%= inn__ru_RU?inn__ru_RU:("<i>"+Resources.notdefine+"</i>") %></b></div>
            <div class="row"><label><%= Resources.ogrn %>:</label><b><%= ogrn__ru_RU?ogrn__ru_RU:("<i>"+Resources.notdefine+"</i>") %></b></div>
            <div class="row"><label><%= Resources.okpo %>:</label><b><%= okpo__ru_RU?okpo__ru_RU:("<i>"+Resources.notdefine+"</i>") %></b></div>
        </div>
        <div class="Country" id="uk-UA">
            <div class="row"><label><%= Resources.edrpou %>:</label><b><%= edrpou__uk_UA?edrpou__uk_UA:("<i>"+Resources.notdefine+"</i>") %></b></div>
        </div>
        <div class="Country" id="kk-KZ">
            <div class="row"><label><%= Resources.iin %>:</label><b><%= inn__kk_KZ?inn__kk_KZ:("<i>"+Resources.notdefine+"</i>") %></b></div>
            <div class="row"><label><%= Resources.rnn %>:</label><b><%= rnn__kk_KZ?rnn__kk_KZ:("<i>"+Resources.notdefine+"</i>") %></b></div>
            <div class="row"><label><%= Resources.bin %>:</label><b><%= bin__kk_KZ?bin__kk_KZ:("<i>"+Resources.notdefine+"</i>") %></b></div>
        </div>

        <div class="Country" id="vi-VN">
            <div class="row"><label>TaxCode:</label><b><%= inn__vi_VN?inn__vi_VN:("<i>"+Resources.notdefine+"</i>") %></b></div>
            <div class="row"><label>Business line code:</label><b><%= ogrn__vi_VN?ogrn__vi_VN:("<i>"+Resources.notdefine+"</i>") %></b></div>
        </div>
    </div>
</div>

<div class="row files-collection card">

    <div class="title">

        <div class="extcode-block">
            <div class="dropdown-menu code">
                <span class="icon-close" data-icon="icon-close-xl"></span>
                <label><%= Resources.titlecopycode %></label>
                <textarea></textarea>
                <p>
                    <a style="float: left" href="#" id="linkGsearch">Search in GS</a>
                    <a style="float: left; padding-left: 10px" href="#" id="linkEsearch">Search in ES</a>
                    <button class="btn btn-blue copy-to-clipboard"><span class="font-icon font-icon-copy"></span></button>
                </p>
                <span class="dropmenu-arrow" position="bottom"></span>
            </div>
            <div>
                <svg class="svg-icon"><use xlink:href="#ext-code"></use></svg>&nbsp;<span><%= Resources.titlecode %>:</span>&nbsp;<span class="link"><%= Resources.get %></span>
            </div>
        </div>


        <!--<span data-icon="icon-file"></span> <%= Resources.attach %> (<span class="amount-files">0</span>):
        &nbsp;&nbsp;
        <span class="ring show-attach-manage"><%= Resources.add %></span>
        <div class="dropdown-menu attach-manage"></div>-->
    </div>
    <!--<div class="attached-files-list"></div>-->

</div>

<br />
<br />