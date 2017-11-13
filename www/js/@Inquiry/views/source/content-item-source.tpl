<h3><%- display_name %></h3>

<div id="link-rubrics"></div>

    <% if(systemtypename==="VideoSource"){%>
<div>
    <video id="videoFact<%= object_id %>" class="video-js vjs-default-skin Videosource" preload="none" poster="/images/Display128x128.png">
        <source src="<%= MediaUrl %><% if(PlayingAt){ %>#t=<%= PlayingAt %>,<%= PlayingUntil %><% } %>" type="video/mp4">
    </video>
    <nav>
        <button class="Play" data-start="<%= PlayingAt %>" data-end="<%= PlayingUntil %>">&nbsp;</button>
        <span class="Duration"></span>
    </nav>
</div>
    <% } else if(systemtypename==="Audiosource"){ %>
<div>
    <video id="videoFact<%= Object_ID %>" class="video-js vjs-default-skin Audiosource" preload="none" poster="/images/Headphones128x128.png">
        <source src="<%= MediaUrl %><% if(PlayingAt){ %>#t=<%= PlayingAt %>,<%= PlayingUntil %><% } %>" type="audio/mp3">
    </video>
    <nav>
        <button class="Play" data-start="<%= PlayingAt %>" data-end="<%= PlayingUntil %>">&nbsp;</button>
        <span class="Duration"></span>
    </nav>
</div>
    <% } %>

<div class="format"><%= textsource %></div>

<div class="right media">
    <i><%= author %></i>
    <br />
</div>