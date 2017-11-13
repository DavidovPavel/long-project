<svg style="display:none;">
    <symbol id="icon-filtered" viewBox="0 0 14 16">
        <path d="M7,6h2v10H7V6z" />
        <path d="M7,0h2v3H7V0z" />
        <path d="M14,4.5l-2-2V4H0v1h12v1.5L14,4.5z" />
        <path d="M4,8H0v1h4v1.5l2-2l-2-2V8z" />
    </symbol>

    <symbol id="icon-select" viewBox="0 0 16 16">
        <path d="M1,1h3h3V0H4H0v7h1V1z" />
        <path d="M15,11v4H9v1h7v-5V9h-1V11z" />
        <path d="M1,15V9H0v7h7v-1H1z" />
        <path d="M15,1v6h1V0H9v1H15z" />
    </symbol>
</svg>

<div class="">
    <span class="g-form--input" id="input-search">
        <input type="text" id="search-text" name="search-text" value="" class="g-form--input" placeholder="<%- Resources.searchByWord %>">
        <label for="search-text"><%- Resources.searchByWord %></label>
        <i class="search rtl-1"></i>
    </span>
    <div class="g-tabs">
        <span class="btn-link-clear all active" role="button">
            <svg class="icon icon-filtered"><use xlink:href="#icon-filtered"></use></svg>
            <%= Resources.allSources %>&nbsp;(<span class="amount-all">0</span>)
        </span>
        <span class="btn-link-clear sel" role="button">
            <svg class="icon icon-select"><use xlink:href="#icon-select"></use></svg>
            <%= Resources.selected2 %>&nbsp;(<span class="amount-selected">0</span>)
        </span>
    </div>
</div>
<div id="info-window"></div>
<div id="all-list"></div>
<div id="selected-list" style="display:none;"></div>