 <div class="sys-role-interface">
        <div class="list-cmd-panel"></div>
        <select name="ProjectRole_ID"></select>
    </div>

    <% if(RelationsDescriptionData){ %>
    <div class="relations-data">
        <div class="for-card">
            <span class="g-form--input">
                <input type="text" id="add-role" class="g-form--input" placeholder="<%- Resources.pinfo %>" />
                <label><%- Resources.pinfo %></label>
                <i title="<%- Resources.add %>" class="ok rtl-1 add-btn"></i>
            </span>
            <span class="list-sources"></span>
        </div>
    </div>
    <% } %>

    <div class="row">
        <div class="col-md-9"></div>
        <div class="col-md-3">
            <!--<%= Resources.cdate %>:<select class="form-control check-date"></select>-->
        </div>
    </div>
    <div class="row object-card">
        <div class="col-md-6 left">
            <div class="row"><label><%= Resources.surname %>:</label><b><%= lname_INTERN %></b></div>
            <div class="row"><label><%= Resources.name %>:</label><b><%= fname_INTERN?fname_INTERN:("<i>"+Resources.notdefine+"</i>") %></b></div>
            <div class="row"><label><%= Resources.patronymic %>:</label><b><%= mname_INTERN?mname_INTERN:("<i>"+Resources.notdefine+"</i>") %></b></div>
            <div class="row"><label><%= Resources.previousname %>:</label><b><%= pname_INTERN?pname_INTERN:("<i>"+Resources.notdefine+"</i>") %></b></div>
            <div class="row"><label><%= Resources.uname %>:</label><b><%= universalname_INTERN?universalname_INTERN:("<i>"+Resources.notdefine+"</i>") %></b></div>

            <div class="row"><label><%= Resources.searchwiththesynonyms %>:</label><b><%= searchSin_INTERN?(Resources.on+" "+ Resources.synonims + ": "+synonyms_INTERN.length):("<i>"+Resources.off+"</i>") %></b></div>

            <div class="synonimus"></div>
        </div>

        <div class="col-md-6 right">
            <div class="row"><label><%= Resources.bdate %>:</label><b><%= (birthDateExact_INTERN?new Date(birthDateExact_INTERN).toLocaleDateString(Resources.Lang):("<i>"+Resources.notdefine+"</i>")) %></b></div>
            <div class="row"><label><%= Resources.appage %>:</label><b><%= age_INTERN?(age_INTERN+"<span>&#8723</span>"+(ageFromTo_INTERN?ageFromTo_INTERN:0)):("<i>"+Resources.notdefine+"</i>") %></b></div>
            <div class="row">
                <label><%= Resources.Range %>:</label><b>
                    <%= birthDateFrom_INTERN||birthDateTo_INTERN?((birthDateFrom_INTERN?new Date(birthDateFrom_INTERN).toLocaleDateString(Resources.Lang):0)+" &#8210 "+
                    (birthDateTo_INTERN?new Date(birthDateTo_INTERN).toLocaleDateString(Resources.Lang):0)):("<i>"+Resources.notdefine+"</i>") %>
                </b>
            </div>

            <div class="row"><label><%= Resources.country %>:</label><b><%= Resources[selectedCountries[0]] %></b></div>
            <div class="Country" id="ru-RU">
                <div class="row"><label><%= Resources.passport %>:</label><b><%= (pasSerial__ru_RU+pasNumber__ru_RU)?(pasSerial__ru_RU+" "+pasNumber__ru_RU):("<i>"+Resources.notdefine+"</i>") %></b></div>
                <div class="row"><label><%= Resources.idate %>:</label><b><%= (pasDate__ru_RU?new Date(pasDate__ru_RU).toLocaleDateString("ru-RU"):("<i>"+Resources.notdefine+"</i>")) %></b></div>
                <div class="row"><label><%= Resources.inn %>:</label><b><%= inn__ru_RU?inn__ru_RU:("<i>"+Resources.notdefine+"</i>") %></b></div>
                <div class="row"><label><%= Resources.ogrnip %>:</label><b><%= ogrnip__ru_RU?ogrnip__ru_RU:("<i>"+Resources.notdefine+"</i>") %></b></div>
            </div>
            <div class="Country" id="uk-UA">
                <div class="row"><label><%= Resources.passport %>:</label><b><%= pasSerial__uk_UA+pasNumber__uk_UA?(pasSerial__uk_UA+" "+pasNumber__uk_UA):("<i>"+Resources.notdefine+"</i>") %></b></div>
                <div class="row"><label><%= Resources.idate %></label>:<b><%= (pasDate__uk_UA?new Date(pasDate__uk_UA).toLocaleDateString("uk-UA"):("<i>"+Resources.notdefine+"</i>")) %></b></div>
                <div class="row"><label><%= Resources.inn %></label>:<b><%= inn__uk_UA?inn__uk_UA:("<i>"+Resources.notdefine+"</i>") %></b></div>
            </div>
            <div class="Country" id="kk-KZ">
                <div class="row"><label><%= Resources.passport %>:</label><b><%= pasSerial__kk_KZ+pasNumber__kk_KZ?(pasSerial__kk_KZ+" "+pasNumber__kk_KZ):("<i>"+Resources.notdefine+"</i>") %></b></div>
                <div class="row"><label><%= Resources.idate %>:</label><b><%= (pasDate__kk_KZ?new Date(pasDate__kk_KZ).toLocaleDateString("kk-KZ"):("<i>"+Resources.notdefine+"</i>")) %></b></div>
                <div class="row"><label><%= Resources.iin %>:</label><b><%= inn__kk_KZ?inn__kk_KZ:("<i>"+Resources.notdefine+"</i>") %></b></div>
            </div>
            <div class="Country" id="vi-VN">
                <div class="row"><label>ID Number:</label><b><%= inn__vi_VN?inn__vi_VN:("<i>"+Resources.notdefine+"</i>") %></b></div>
            </div>
            <div class="Country" id="ms-MY">
                <div class="row"><label>Identity Card:</label><b><%= IdentityCard__ms_MY?IdentityCard__ms_MY:("<i>"+Resources.notdefine+"</i>") %></b></div>
                <div class="row"><label>Police:</label><b><%= Police__ms_MY?Police__ms_MY:("<i>"+Resources.notdefine+"</i>") %></b></div>
                <div class="row"><label>Army:</label><b><%= Army__ms_MY?Army__ms_MY:("<i>"+Resources.notdefine+"</i>") %></b></div>
                <div class="row"><label>Passport No.:</label><b><%= PassportNo__ms_MY?PassportNo__ms_MY:("<i>"+Resources.notdefine+"</i>") %></b></div>
            </div>

        </div>

    </div>


    <div class="row files-collection card">

        <div class="title">

            <!--<div class="extcode-block">
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
            </div>-->

            <!--<span data-icon="icon-file"></span> <%= Resources.attach %> (<span class="amount-files">0</span>):
            &nbsp;&nbsp;
            <span class="ring show-attach-manage"><%= Resources.add %></span>
            <div class="dropdown-menu attach-manage"></div>-->
        </div>
        <!--<div class="attached-files-list"></div>-->
    </div>

    <br />
    <br />