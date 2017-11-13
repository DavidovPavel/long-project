<div class="top-panel">
    <h3 class="tac"><%- Resources.och %>: <%- Resources.company %></h3>
</div>

<div class="g-form--wizard">

    <fieldset class="g-form--fieldset" name="main">
        <legend><%- Resources.mp %></legend>

        <div class="row">
            <div class="grid--1-1">
                <span class="g-form--input">
                    <input type="text" value="<%- title_INTERN %>" name='title_INTERN' id="title_INTERN" class="g-form--input check-key" placeholder="<%- Resources.nameofcompany %>" />
                    <label for="title_INTERN"><%- Resources.nameofcompany %></label>
                    <i class="clear rtl-1"></i>
                </span>
            </div>

            <div id="select-countries"></div>

            <div class="grid--1-1">
                <span class="g-form--input">
                    <input type="text" value="<%- address_INTERN %>" name='address_INTERN' id="Address" class="g-form--input" placeholder="<%- Resources.address %>" />
                    <label for="address"><%- Resources.address %></label>
                    <i class="clear rtl-1"></i>
                </span>
            </div>

            <div class="grid--1-2">
                <div class="g-form--input">
                    <select id="projectRoleID"></select>
                    <label class="g-form--label"><%- Resources.role %></label>
                </div>
            </div>
            <div class="grid--1-2">
                <span class="g-form--input">
                    <input type="text" id="uniname" class="g-form--input any-info" placeholder="<%- Resources.anyinfo %>" />
                    <label for="uniname"><%- Resources.anyinfo %></label>
                    <i class="clear rtl-1"></i>
                </span>
            </div>
        </div>

    </fieldset>

    <div id="synonimus-panel"></div>
    
    <!--<fieldset class="g-form--fieldset acc" name="main">
        <legend><%- Resources.attach %> [ <span class="amount-files">0</span> ]</legend>
        <div class="row">
            <div class="grid--1-1 files-manager"></div>
        </div>
    </fieldset>-->

</div>