<div class="note-head" data-id="<%= id %>">
    <% if(title.toLowerCase().indexOf(Resources.nt)!==-1){ %>
    <span data-icon="icon-attention" color-icon="red"></span>
    <% } %>
    <span><%= title %></span>
</div>
<div class="notes-container"></div>
<div class="child-container"></div>