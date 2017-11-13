<div class="head-content">
    <h3><%- display_name %></h3>

    <div class="tools"></div>

    <!--<div class="gotoresult" data-id="6782E40B-794A-467D-BC8E-21992920317D"><span class="total"></span>&nbsp;<button class="up"><%- Resources.go %></button></div>-->

    <div class="card-rubric"><p></p></div>
</div>
<div class="load">

    <% if(systemtypename==="VideoSource" || systemtypename==="Audiosource"){ %>

    <video class="video-js vjs-default-skin"
           preload="none"
           poster="/images/<%- systemtypename==='Audiosource'?'Headphones':'Display' %>128x128.png"
           data-setup='{}'>

        <source src="<%= mediaurl %><% if(playingat){ %>#t=<%= playingat %>,<%= playinguntil %><% } %>"
                type="<%- systemtypename==='Audiosource'?'audio/mp3':'video/mp4' %>"></source>

    </video>

    <nav>
        <button class="play-button" data-start="<%- playingat %>" data-end="<%- playinguntil %>">play</button>
        <span class="Duration"></span>
    </nav>

    <% } %>

    <%= textsource %>
    <%= webfile %>

    <br /><br />
    <i><%- author %></i>
    <div class="card-link"></div>
</div>
