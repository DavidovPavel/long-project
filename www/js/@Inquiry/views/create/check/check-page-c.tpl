
<!--
    
    <div class="top-panel">
    <h3 class="tac"><%- Resources.searchParams %></h3>
</div>

<div class="g-form--wizard">
    <fieldset class="g-form--fieldset">
        <legend><%- Resources.options %></legend>
        <div class="row">
            <div class="grid--1-1">
                <span class="g-form--input" style="width:auto; padding-right:48px">
                    <input type="checkbox" value="" class="g-form--checkbox" id="runautoselect" name="AutoExtractionIsActive" <%- AutoExtractionIsActive?'checked':'' %> />
                    <label for="runautoselect"><%- Resources.runAutoSelect %></label>
                    <i class="help rtl-1"></i>
                    <span class="g-tip bottom">
                        <kbd></kbd>
                        <span>
                            <h4><%- Resources.alert %></h4>
                            <p><%- Resources.Refer8 %></p>
                        </span>
                    </span>
                </span>
            </div>
            <div class="grid--1-1">
                <span class="g-form--input">
                    <input type="checkbox" class="g-form--checkbox" name="searchSin_INTERN" id="flag-synonims" <%- searchSin_INTERN?'checked':'' %> />
                    <label for="flag-synonims"><%- Resources.searchwiththesynonyms %></label>
                </span>
            </div>
        </div>
    </fieldset>
</div>
-->

<div class="top-panel">
    <h3 class="tac"><%- Resources.checkId %></h3>
</div>
<div class="g-form--wizard">
    <div class="matchesList"></div>
</div>