<div class="top-panel">
    <h3 class="tac"><%- Resources.ic %></h3>
</div>
<div class="g-form--wizard">
    <fieldset class="g-form--fieldset" name="main">
        <legend><%- Resources.mp %></legend>
        <div class="row">
            <div class="grid--1-1">
                <span class="g-form--input">
                    <input type="text" value="<%- title_INTERN %>" name='title_INTERN' id="title_INTERN2" class="g-form--input" placeholder="<%- Resources.nameofcompany %>" />
                    <label for="title_INTERN2"><%- Resources.nameofcompany %></label>
                    <i class="clear rtl-1"></i>
                </span>
            </div>

            <div class="Country">
                <div class="grid--1-3">
                    <span class="g-form--input">
                        <input type="text" value="<%- inn__ru_RU %>" maxlength="16" name='inn__ru_RU' id="inn" class="g-form--input" placeholder="<%- Resources.inn %>" />
                        <label for="inn"><%- Resources.inn %></label>
                        <i class="clear rtl-1"></i>
                    </span>
                </div>
                <div class="grid--1-3">
                    <span class="g-form--input">
                        <input type="text" value="<%- ogrn__ru_RU %>" name='ogrn__ru_RU' id="ogrn" class="g-form--input" placeholder="<%- Resources.ogrn %>" />
                        <label for="ogrn"><%- Resources.ogrn %></label>
                        <i class="clear rtl-1"></i>
                    </span>
                </div>
                <div class="grid--1-3">
                    <span class="g-form--input">
                        <input type="text" value="<%- okpo__ru_RU %>" name='okpo__ru_RU' id="okpo" class="g-form--input" placeholder="<%- Resources.okpo %>" />
                        <label for="okpo"><%- Resources.okpo %></label>
                        <i class="clear rtl-1"></i>
                    </span>
                </div>
                <div class="grid--1-1">
                    <span class="g-form--input">
					<!-- address__ru_RU don't use -->
                        <input type="text" value="<%- address_INTERN %>" name="address_INTERN" id="address" class="g-form--input" placeholder="<%- Resources.address %>" />
                        <label for="address"><%- Resources.address %></label>
                        <i class="clear rtl-1"></i>
                    </span>
                </div>
            </div>
        </div>
    </fieldset>


    <div class="top-panel">
        <h3 class="tac"><%- Resources.pcp %></h3>
    </div>
    <fieldset class="g-form--fieldset acc" id="egrul-check">

        <legend><%- Resources.cigr %><span data-icon="icon-loader" id="egrul-process-loader" style="display:none;"></span></legend>

        <button class="g-form--button flat accept" style="display:none;"><%- Resources.accept %></button>
        <button class="g-form--button flat" id="check-UGRL"><%- Resources.runagain %></button>
        <div class="row">
            <div class="grid--1-1"><div id="egrul-result"></div></div>
        </div>
    </fieldset>

    <fieldset class="g-form--fieldset acc">
        <legend><%- Resources.cso %></legend>
        <button class="g-form--button flat" disabled><%- Resources.runagain %></button>
        <div class="row">
            <div class="grid--1-1">
                <!--Статус: Действующая-->
            </div>
        </div>
    </fieldset>
    <fieldset class="g-form--fieldset acc">
        <legend><%- Resources.vchc %></legend>
        <button class="g-form--button flat" disabled><%- Resources.runagain %></button>
        <div class="row">
            <div class="grid--1-1">
            </div>
        </div>
    </fieldset>
    <fieldset class="g-form--fieldset acc">
        <legend><%- Resources.chrio %></legend>
        <button class="g-form--button flat" disabled><%- Resources.runagain %></button>
        <div class="row">
            <div class="grid--1-1">
            </div>
        </div>
    </fieldset>
</div>