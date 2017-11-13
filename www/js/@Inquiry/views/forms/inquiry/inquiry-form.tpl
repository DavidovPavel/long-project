<div class="row">
    <div class="grid--1-3">
        <span class="g-form--input">
            <input value="<%- projectName %>" type="text" class="g-form--input" name='projectName' placeholder="<%- Resources.nameofinquiry %>">
            <label for="projectName"><%- Resources.nameofinquiry %><sup>*</sup></label>
            <i class="rtl-1 clear"></i>
        </span>
    </div>

    <div class="grid--1-3 rubric-param"></div>

    <div class="grid--1-3">
        <span class="g-form--input">
            <input value="<%- projectCode %>" maxlength="50" type="text" class="g-form--input" name='projectCode' placeholder="<%- Resources.codeinquiry %>">
            <label for="projectCode"><%- Resources.codeinquiry %></label>
            <i class="rtl-1 clear"></i>
        </span>
    </div>
</div>
<div class="options">
    <div class="row tar">
        <span data-icon="icon-clean" class="clear-form"><%- Resources.clear1 %></span>
    </div>
</div>
<div class="row">
    <button class="g-form--button left prev" name="cancel"><%- Resources.cancel %></button>

    <button class="g-form--button right next" name="save"><%- Resources.save %></button>
</div>