<div class="grid--1-1">
    <div class="g-form--input">
        <select></select><label class="g-form--label"><%- Resources.Country %></label>
    </div>
</div>

<div class="countries">
    <% if(typeSystemName==='Organization'){ %>

    <!-- ru-RU -->
    <div id="ru-RU">
        <div class="grid--1-3">
            <span class="g-form--input">
                <input value="<%= inn__ru_RU %>" maxlength="16" type="text" class="g-form--input" name='inn__ru_RU' placeholder="<%= Resources.inn %>">
                <label for="inn__ru_RU"><%= Resources.inn %></label>
            </span>
        </div>
        <div class="grid--1-3">
            <span class="g-form--input">
                <input value="<%= ogrn__ru_RU %>" type="text" class="g-form--input" name='ogrn__ru_RU' maxlength="15" placeholder="<%= Resources.ogrn %>">
                <label for="ogrn__ru_RU"><%= Resources.ogrn %></label>
            </span>
        </div>
        <div class="grid--1-3">
            <span class="g-form--input">
                <input value="<%= okpo__ru_RU %>" type="text" class="g-form--input" name='okpo__ru_RU' placeholder="<%= Resources.okpo %>">
                <label for="okpo__ru_RU"><%= Resources.okpo %></label>
            </span>
        </div>
    </div>

    <!-- kk-KZ -->
    <div id="kk-KZ">
        <div class="grid--1-2">
            <span class="g-form--input">
                <input value="<%= rnn__kk_KZ %>" type="text" class="g-form--input" name='rnn__kk_KZ' placeholder="<%= Resources.rnn %>">
                <label for="rnn__kk_KZ"><%= Resources.rnn %></label>
            </span>
        </div>

        <div class="grid--1-2">
            <span class="g-form--input">
                <input value="<%= bin__kk_KZ %>" type="text" class="g-form--input" name='bin__kk_KZ' placeholder="<%= Resources.bin %>">
                <label for="bin__kk_KZ"><%= Resources.bin %></label>
            </span>
        </div>
    </div>

    <!-- be-BY -->
    <div id="be-BY">
        <div class="grid--1-1">
            <span class="g-form--input">
                <label for="unp__bl_BL"><%= Resources.unp %></label>
                <input value="<%= unp__bl_BL %>" type="text" class="g-form--input" name='unp__bl_BL' placeholder="">
            </span>
        </div>
    </div>

    <!-- uk-UA -->
    <div id="uk-UA">
        <div class="grid--1-1">
            <span class="g-form--input">
                <input value="<%= edrpou__uk_UA %>" type="text" class="g-form--input" name='edrpou__uk_UA' placeholder="">
                <label for="edrpou__uk_UA"><%= Resources.edrpou %></label>
            </span>
        </div>
    </div>

    <!-- vi-VN -->
    <div id="vi-VN">
        <div class="grid--1-2">
            <span class="g-form--input">
                <input value="<%= inn__vi_VN %>" type="text" class="g-form--input" name='inn__vi_VN' placeholder="Tax Code">
                <label for="inn__vi_VN">Tax Code</label>
            </span>
        </div>
        <div class="grid--1-2">
            <span class="g-form--input">
                <input value="<%= ogrn__vi_VN %>" type="text" class="g-form--input" name='ogrn__vi_VN' placeholder="Business line code">
                <label for="ogrn__vi_VN">Business line code</label>
            </span>
        </div>
    </div>

    <!-- zh-CN -->
    <div id="zh-CN">
        <div class="grid--1-1">
            <span class="g-form--input">
                <input value="<%= RegistrationNumber__zh_CN %>" type="text" class="g-form--input" name='RegistrationNumber__zh_CN' id="RegistrationNumber__zh_CN" placeholder="Registration Number">
                <label for="RegistrationNumber__zh_CN">Registration Number</label>
            </span>
        </div>
    </div>

    <!-- zh-TW -->
    <div id="zh-TW">
        <div class="grid--1-2">
            <span class="g-form--input">
                <input value="<%= TaxID__zh_TW %>" type="text" class="g-form--input" name='TaxID__zh_TW' id="TaxID__zh_TW" placeholder="Tax ID">
                <label for="TaxID__zh_TW">Tax ID</label>
            </span>
        </div>
        <div class="grid--1-2">
            <span class="g-form--input">
                <input value="<%= RegistrationNumber__zh_TW %>" type="text" class="g-form--input" name='RegistrationNumber__zh_TW' id="RegistrationNumber__zh_TW" placeholder="Registration Number">
                <label for="RegistrationNumber__zh_TW">Registration Number</label>
            </span>
        </div>
    </div>

    <!-- zh-HK -->
    <div id="zh-HK">
        <div class="grid--1-1">
            <span class="g-form--input">
                <input value="<%= RegistrationNumber__zh_HK %>" type="text" class="g-form--input" name='RegistrationNumber__zh_HK' id="RegistrationNumber__zh_HK" placeholder="Registration Number">
                <label for="RegistrationNumber__zh_HK">Registration Number</label>
            </span>
        </div>
    </div>

    <% } else if(typeSystemName==='Person'){ %>

    <!-- ru-RU -->
    <div id="ru-RU">
        <div class="row">
            <div class="grid--1-4">
                <span class="g-form--input">
                    <label for="pasSerial__ru_RU" class="g-form--label"><%= Resources.passport %></label>
                    <input value="<%= pasSerial__ru_RU %>" style="width:calc(40% - 0.5em)" type="text" name="pasSerial__ru_RU" class="g-form--input" maxlength="4" placeholder="0000">
                    <input value="<%= pasNumber__ru_RU %>" style="width:calc(60% - 0.5em)" type="text" name="pasNumber__ru_RU" class="g-form--input" maxlength="6" placeholder="000000">
                </span>
            </div>
            <div class="grid--1-4">
                <span class="g-form--input">
                    <input value="<%= pasDate__ru_RU %>" name="pasDate__ru_RU" type="text" class="g-form--input ejdatepicker" placeholder="<%= Resources.formatDate %>">
                    <label class="g-form--label" for="pasDate__ru_RU"><%= Resources.idate %></label>
                </span>
            </div>
            <div class="grid--1-4">
                <span class="g-form--input">
                    <input value="<%= inn__ru_RU %>" maxlength="16" name="inn__ru_RU" type="text" class="g-form--input" placeholder="<%= Resources.inn %>">
                    <label class="g-form--label" for="pasDate__ru_RU"><%= Resources.inn %></label>
                </span>
            </div>
            <div class="grid--1-4">
                <span class="g-form--input">
                    <input value="<%= ogrnip__ru_RU %>" name="ogrnip__ru_RU" type="text" class="g-form--input" placeholder="<%= Resources.ogrnip %>">
                    <label for="ogrnip__ru_RU"><%= Resources.ogrnip %></label>
                </span>
            </div>
        </div>
    </div>

    <!-- uk-UA -->
    <div id="uk-UA">
        <div class="row">
            <div class="grid--1-3">
                <span class="g-form--input">
                    <label for="pasSerial__uk_UA" class="g-form--label"><%= Resources.passport %></label>
                    <input value="<%= pasSerial__uk_UA %>" style="width:calc(40% - 0.5em)" type="text" name="pasSerial__uk_UA" class="g-form--input" maxlength="4" placeholder="0000">
                    <input value="<%= pasNumber__uk_UA %>" style="width:calc(60% - 0.5em)" type="text" name="pasNumber__uk_UA" class="g-form--input" maxlength="6" placeholder="000000">
                </span>
            </div>
            <div class="grid--1-3">
                <span class="g-form--input">
                    <input value="<%= pasDate__uk_UA %>" name="pasDate__uk_UA" type="text" class="g-form--input ejdatepicker" placeholder="<%= Resources.formatDate %>">
                    <label class="g-form--label" for="pasDate__ru_RU"><%= Resources.idate %></label>
                </span>
            </div>
            <div class="grid--1-3">
                <span class="g-form--input">
                    <input value="<%= inn__uk_UA %>" maxlength="16" name="inn__uk_UA" type="text" class="g-form--input" placeholder="<%= Resources.inn %>">
                    <label class="g-form--label" for="inn__uk_UA"><%= Resources.inn %></label>
                </span>
            </div>
        </div>
    </div>

    <!-- kk-KZ -->
    <div id="kk-KZ">
        <div class="row">
            <div class="grid--1-3">
                <span class="g-form--input">
                    <label for="pasSerial__uk_UA" class="g-form--label"><%= Resources.passport %></label>
                    <input value="<%= pasSerial__kk_KZ %>" style="width:calc(40% - 0.5em)" type="text" name="pasSerial__kk_KZ" class="g-form--input" maxlength="4" placeholder="0000">
                    <input value="<%= pasNumber__kk_KZ %>" style="width:calc(60% - 0.5em)" type="text" name="pasNumber__kk_KZ" class="g-form--input" maxlength="6" placeholder="000000">
                </span>
            </div>
            <div class="grid--1-3">
                <span class="g-form--input">
                    <input value="<%= inn__kk_KZ %>" name="inn__kk_KZ" type="text" class="g-form--input" placeholder="<%= Resources.iin %>">
                    <label><%= Resources.iin %></label>
                </span>
            </div>
            <div class="grid--1-3">
                <span class="g-form--input">
                    <input value="<%= pasDate__kk_KZ %>" name="pasDate__kk_KZ" type="text" class="g-form--input ejdatepicker" placeholder="<%= Resources.formatDate %>">
                    <label class="g-form--label" for="pasDate__kk_KZ"><%= Resources.idate %></label>
                </span>
            </div>
        </div>
    </div>

    <!-- vi-VN -->
    <div id="vi-VN">
        <div class="row">
            <div class="grid--1-2">
                <span class="g-form--input">
                    <input value="<%= inn__vi_VN %>" type="text" name="inn__vi_VN" class="g-form--input" placeholder="ID Number">
                    <label for="inn__vi_VN">ID Number</label>
                </span>
            </div>
        </div>
    </div>

    <!-- ms-MY -->
    <div id="ms-MY">
        <div class="row">
            <div class="grid--1-4">
                <span class="g-form--input">
                    <input value="<%= IdentityCard__ms_MY %>" type="text" name="IdentityCard__ms_MY" class="g-form--input" placeholder="Identity Card">
                    <label for="IdentityCard__ms_MY">Identity Card</label>
                </span>
            </div>
            <div class="grid--1-4">
                <span class="g-form--input">
                    <input value="<%= Police__ms_MY %>" name="Police__ms_MY" type="text" class="g-form--input" placeholder="Police">
                    <label for="Police__ms_MY">Police</label>
                </span>
            </div>
            <div class="grid--1-4">
                <span class="g-form--input">
                    <input value="<%= Army__ms_MY %>" name="Army__ms_MY" type="text" class="g-form--input" placeholder="Army">
                    <label for="Army__ms_MY">Army</label>
                </span>
            </div>
            <div class="grid--1-4">
                <span class="g-form--input">
                    <input value="<%= PassportNo__ms_MY %>" name="PassportNo__ms_MY" type="text" class="g-form--input" placeholder="Passport No.">
                    <label for="PassportNo__ms_MY">Passport No.</label>
                </span>
            </div>
        </div>
    </div>

    <!-- zh-CN -->
    <div id="zh-CN">
        <div class="row">
            <div class="grid--1-1">
                <span class="g-form--input">
                    <input value="<%= TaxNumber__zh_CN %>" type="text" name="TaxNumber__zh_CN" id="TaxNumber__zh_CN" class="g-form--input" placeholder="Tax Number">
                    <label for="TaxNumber__zh_CN">Tax Number</label>
                </span>
            </div>
        </div>
    </div>

    <!-- zh-TW -->
    <div id="zh-TW">
        <div class="row">
            <div class="grid--1-1">
                <span class="g-form--input">
                    <input value="<%= TaxNumber__zh_TW %>" type="text" name="TaxNumber__zh_TW" id="TaxNumber__zh_TW" class="g-form--input" placeholder="Tax Number">
                    <label for="TaxNumber__zh_TW">Tax Number</label>
                </span>
            </div>
        </div>
    </div>

    <!-- zh-HK -->
    <div id="zh-HK">
        <div class="row">
            <div class="grid--1-1">
                <span class="g-form--input">
                    <input value="<%= TaxNumber__zh_HK %>" type="text" name="TaxNumber__zh_HK" id="TaxNumber__zh_HK" class="g-form--input" placeholder="Tax Number">
                    <label for="TaxNumber__zh_HK">Tax Number</label>
                </span>
            </div>
        </div>
    </div>
    
    <% } %>
</div>