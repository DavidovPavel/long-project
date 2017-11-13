<div class="tabs">
    <ul class="nav nav-tabs" style="margin:0;">
        <li class="active">
            <a href="#doc3"><%- Resources.upload %> <%- Resources.fromfile %></a>
        </li>
        <li>
            <a href="#doc2"><%- Resources.originaldoc %></a>
        </li>
    </ul>

    <div id="doc3">
        <div class="progress">
            <div class="bar"></div>
            <div class="percent">0%</div>
        </div>
        <form id="uploadFile" method="post" action="<%= linktoupload %>" enctype="multipart/form-data">
            <input id="fileToUpload" type="file" name="fileToUpload" />
            <input type="hidden" name="objID" value="<%- id %>" />
            <input type="hidden" name="title" value="<%= Display_Name %>" />
            <input type="hidden" name="typeid" value="<%= typeid %>" />
            <input type="hidden" name="smi" value="<%= MassMedia %>" />
            <input type="hidden" name="author" value="<%= Author %>" />
            <input type="hidden" name="pdate" value="" />
            <input type="hidden" name="rubricid" />
        </form>

        <div id="status"></div>
        <div id="linkToFile"></div>
    </div>

    <div id="doc2" style="padding:6px;display:none;">
        <p>
            <input type="checkbox" name="IsMedia" class="g-form--checkbox" id="IsMedia" />&nbsp;
            <label for="IsMedia"><%- Resources.isMedia %></label>
        </p>
        <div class="htmlEditor">
            <textarea></textarea>
        </div>
    </div>

</div>


<div class="Main">
    <div style="margin-bottom:6px;">
        <input type="text" class="title" name="Display_Name" value="<%= Display_Name %>" placeholder="<%- Resources.title %>" />
    </div>

    <div style="margin-bottom:6px;">
        <input type="text" class="smi" name="smi" value="<%= MassMedia %>" placeholder="<%- Resources.smi %>" />
    </div>

    <div style="margin-bottom:6px;">
        <input type="text" class="author" name="author" value="<%= Author %>" placeholder="<%- Resources.author %>" />
    </div>

    <div style="margin-bottom:6px;">
        <input type="text" class="datepicker" name="pdate" value="" placeholder="<%- Resources.pdate %>" />
    </div>

    <div class="TreeTypes">
        <b><%- Resources.type %>&nbsp;<span class="titleType"><%- Resources.source %></span></b>
        <div class="loadTree"></div>
    </div>
</div>