<div class="row">

    <div class="grid--1-3">
        <span class="g-form--input">
            <input type="text" class="g-form--input" id="inputText" name="inputText" placeholder="<%- Resources.kw %>" />
            <label for="inputFilter"><%- Resources.kw %></label>
            <i class="rtl-1 clear"></i>
        </span>
    </div>

    <div class="grid--1-3 rubric-param"></div>

    <div class="grid--1-3">
        <span class="g-form--input">
            <input type="text" class="g-form--input" id="input-exec" placeholder="<%- Resources.ex %>" />
            <label for="input-exec"><%- Resources.ex %></label>
            <i class="rtl-1 clear"></i>
        </span>
    </div>

</div>

<div class="row">

    <div class="grid--1-4">
        <span class="g-form--input">
            <input type="text" id="datepickerFrom" class="g-form--input" />
            <label class="g-label" for="datepickerFrom"><%- Resources.from %></label>
        </span>
    </div>
    <div class="grid--1-4">
        <span class="g-form--input">
            <input type="text" id="datepickerTo" class="g-form--input" />
            <label class="g-label" for="datepickerTo"><%- Resources.to %></label>
        </span>
    </div>

    <div class="grid--1-4">
        <div id="results"></div>
    </div>

    <div class="grid--1-4">
        <div id="status"></div>
    </div>

</div>

<div class="row">

    <span class="g-form--input">
        <button name="start-search" class="g-form--button right flat blue nest-right"><%- Resources.search %></button>
        <button name="clear-form" class="g-form--button right flat nest-left"><%- Resources.clear %></button>
    </span>

</div>