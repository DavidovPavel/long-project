<div style="width:40%;float:left;">
    <%- Resources.currentObj %> :
    <b><%- title %></b>
    <div style="text-align:right;">
        <span class="titleType"> &nbsp;</span>
    </div>
    <div class="load-tree" style="height:200px;overflow:auto;"></div>
    <div>
        <input type="checkbox" id="link2obj" class="g-form--checkbox" checked="checked">
        <label for="link2obj"><%- Resources.linktoobj %></label>
    </div>
    <div class="load-links" style="height:120px;overflow:auto;margin-top:12px;">
        <div class="link-list"></div>
    </div>
</div>
<div style="width:60%;margin-left:40%;">
    <div style="padding-left:20px;" class="search-form">
        <input type="text" name="title" placeholder="<%- Resources.nameVidget %>" />
        <p style="margin-top:6px;">
            <!-- <button class="g-form--button search" > <%= Resources.search %> </button > &nbsp; <button class="g-form--button create blue" > <%= Resources.create %> </button > &nbsp; <button class="g-form--button clear" > <%= Resources.clear %> </button >-->
        </p>
    </div>
    <div class="search-result" style="height:300px;overflow:auto;"> </div>
</div>