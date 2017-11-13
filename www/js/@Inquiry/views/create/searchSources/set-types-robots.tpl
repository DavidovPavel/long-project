<div class="g-panel <%- selected?'selected':'' %>">
        <h4 contenteditable="<%- SearchPackName?'false':'true' %>"><%- SearchPackName %></h4>
        <table class="blank">
            <tbody>
                <tr>
                    <td><%- Resources.selSources %></td>
                    <td><%- SourcesCount %></td>
                </tr>
                <tr>
                    <td><%- Resources.sum %></td>
                    <td><%- Sum %> <%- Resources.u %></td>
                </tr>
            </tbody>
        </table>
        <div class="g-panel--options tac">
            <div class="grid--1-3"><span data-icon="icon-eye"></span></div>
            <% if(!IsSystem) { %>
            <div class="grid--1-3"><span data-icon="icon-round-check"></span></div>
            <div class="grid--1-3"><span data-icon="icon-trash"></span></div>
            <% } %>
            <div style="clear:both"></div>
        </div>
    </div>