<div class="g-sortable--list-item">

        <input type="hidden" name="QueryCustomizationUID" value="<%- QueryCustomizationUID %>" />
        <input type="hidden" name="QueryID" value="<%- QueryID %>" />
        <input type="hidden" name="ColumnSystemName" value="<%- ColumnSystemName %>" />
        <input type="hidden" name="SerialNum" value="<%- SerialNum %>" />

        <span>
            <input class="g-form--checkbox" type="checkbox" id="<%- prefix + ColumnSystemName %>" name="ColumnIsVisible" <%= ColumnIsVisible?'checked="checked"': '' %> />
            <label for="<%- prefix + ColumnSystemName %>"></label>
        </span>

        &nbsp;
        <input type="text" name="ColumnTitle" value="<%= ColumnTitle %>" placeholder="<%= ColumnTitle %>">

        <input type="hidden" id="ColumnWidth" name="ColumnWidth" value="<%- ColumnWidth %>" />
</div>
