<nav>
    <span data-name='rubrics-panel'>
        <svg><use xlink:href='#icon-rubrics' /></svg> <label><%= Resources.rubrics %></label>
    </span>
    <span data-name='search-panel'>
        <svg><use xlink:href='#icon-search-byrubrics' /></svg> <label><%= Resources.search %></label>
    </span>
    <!--<span class='right'>
        <svg class='icon-close'><use xlink:href='#icon-close' /></svg>
    </span>-->
</nav>

<section id='rubrics-panel'>
    <div class='list-area'></div>
</section>

<section id='search-panel'>

    <span class="g-form--input"><input type='text' name='searchInWidget' /></span>
    
	<p>		
		<button class='g-form--button blue right search'><%= Resources.find %></button>
		<button class='g-form--button right cancel'><%= Resources.clear %></button>
	</p>
</section>