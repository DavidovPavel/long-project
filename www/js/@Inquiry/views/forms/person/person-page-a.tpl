<div class="top-panel">
    <h3 class="tac"><%- Resources.och %>: <%- Resources.person %></h3>
</div>
<div class="g-form--wizard">

    <fieldset class="g-form--fieldset" name="main">
        <legend><%- Resources.mp %></legend>
        <div class="row">
            <div class="grid--1-1">
                <span class="g-form--input">
                    <input type="text" value="<%- lname_INTERN %>" name="lname_INTERN" id="lastname" class="g-form--input check-key" placeholder="<%- Resources.surname %>" />
                    <label for="lastname"><%- Resources.surname %></label>
                    <i class="clear rtl-1"></i>
                </span>
            </div>
            <div class="grid--1-1">
                <span class="g-form--input">
                    <input type="text" value="<%- fname_INTERN %>" name="fname_INTERN" id="name" class="g-form--input check-blur" placeholder="<%- Resources.name %>" />
                    <label for="name"><%- Resources.name %></label>
                    <i class="clear rtl-1"></i>
                </span>
            </div>
            <div class="grid--1-1">
                <span class="g-form--input">
                    <input type="text" value="<%- mname_INTERN %>" name="mname_INTERN" id="surname" class="g-form--input check-blur" placeholder="<%- Resources.patronymic %>" />
                    <label for="surname"><%- Resources.patronymic %></label>
                    <i class="clear rtl-1"></i>
                </span>
            </div>
            <div class="grid--1-1">
                <div class="g-form--input">
                    <select id="projectRoleID"></select>
                    <label class="g-form--label"><%- Resources.role %></label>
                </div>
            </div>

            <div id="select-countries"></div>

            <div class="grid--1-2">
                <span class="g-form--input">
                    <input type="text" value="<%= pname_INTERN %>" name="pname_INTERN" id="oldlastname" class="g-form--input" placeholder="<%- Resources.previousname %>" />
                    <label for="oldlastname"><%- Resources.previousname %></label>
                    <i class="clear rtl-1"></i>
                </span>
            </div>
            <div class="grid--1-2">
                <span class="g-form--input">
                    <input type="text" value="<%= universalname_INTERN %>" name="universalname_INTERN" id="uniname" class="g-form--input" placeholder="<%- Resources.uname %>" />
                    <label for="uniname"><%- Resources.uname %></label>
                    <i class="clear rtl-1"></i>
                </span>
            </div>
            <div class="grid--1-1">
                <span class="g-form--input">
                    <input type="text" id="uniname" class="g-form--input any-info" placeholder="<%- Resources.anyinfo %>" />
                    <label for="uniname"><%- Resources.anyinfo %></label>
                    <i class="clear rtl-2"></i>
                    <i class="help rtl-1"></i>
                    <span class="g-tip top">
                        <kbd></kbd>
                        <span>
                            <h4><%- Resources.anyinfo %></h4>
                            <p><%= Resources.tipAnyInfo %></p>
                        </span>
                    </span>
                </span>
            </div>
        </div>
    </fieldset>

    <div id="synonimus-panel"></div>

    <fieldset class="g-form--fieldset acc" name="age">
        <legend><%- Resources.ap %></legend>
        <div class="row">
            <div class="grid--1-3">
                <span class="g-form--input">
                    <input type="text" value="<%= birthDateExact_INTERN %>" name="birthDateExact_INTERN" id="birthDateExact_INTERN" class="g-form--input ejdatepicker" maxlength="10" placeholder="" />
                    <label for="birthDateExact_INTERN" class="g-form--label"><%- Resources.bdate %></label>
                    <i class="clear rtl-1"></i>
                </span>
            </div>
            <div class="grid--1-3">
                <span class="g-form--input">
                    <label for="age_INTERN" class="g-form--label"><%- Resources.appage %></label>
                    <input style="width:80px" type="text" value="<%= age_INTERN %>" name="age_INTERN" id="age_INTERN" class="g-form--input" size="2" maxlength="2" placeholder="00" />
                    <input style="width:80px" type="text" value="<%= ageFromTo_INTERN %>" name="ageFromTo_INTERN" class="g-form--input" size="2" maxlength="2" placeholder="+/-">
                </span>
            </div>
            <div class="grid--1-3">
                <span class="g-form--input">
                    <label for="birthDateFrom_INTERN" class="g-form--label"><%- Resources.Range %></label>
                    <input type="text" value="<%= birthDateFrom_INTERN %>" name="birthDateFrom_INTERN" id="birthDateFrom_INTERN" class="g-form--input ejdatepicker" maxlength="10" placeholder="" />
                    <input type="text" value="<%= birthDateTo_INTERN %>" name="birthDateTo_INTERN" class="g-form--input ejdatepicker" maxlength="10" placeholder="">
                </span>
            </div>
        </div>
    </fieldset>

    <!--<fieldset class="g-form--fieldset acc" name="main">
        <legend><%- Resources.attach %> [ <span class="amount-files">0</span> ]</legend>
        <div class="row">
            <div class="grid--1-1 files-manager"></div>
        </div>
    </fieldset>-->
</div>