<!--<table class="table table-hover">
       <thead><tr><th><input type="checkbox" id="head-report" class="g-form--checkbox"><label for="head-report" style="color:#fff;"><%= Resources.title %></label></th></tr></thead>
   </table>-->

<div class="reports">
    <h4><%- Resources.reports %></h4>
    <table class="table table-hover result">
        <tbody>
            <tr><td style="border-bottom:0;"><input type="checkbox" id="main" class="g-form--checkbox check"><label for="main" style="display:inline"></label><span class="link" data-module="dossier"><%- Resources.resultReport %></span></td></tr>
        </tbody>
    </table>
    <div id="list-reports"></div>
    <br />
</div>

<div class="extracts">
    <h4><%- Resources.titleExtract %></h4>
    <div id="list-extracts"></div>
    <br />
</div>

<div class="semschema">
    <h4><%- Resources.titleSemNet %></h4>
    <div>
        <table class="table table-hover result">
            <tbody>
                <tr><td><input type="checkbox" id="semSchema" class="g-form--checkbox check"><label for="semSchema" style="display:inline"></label><span class="link" data-module="semnet"><%- Resources.semNetRepName %></span></td></tr>
            </tbody>
        </table>
    </div>
    <br />
</div>

<div class="analyst-note">
    <h4><%- Resources.titleAn %></h4>
    <div>
        <table class="table table-hover result">
            <tbody>
                <tr><td><input type="checkbox" id="analystNote" class="g-form--checkbox check"><label for="analystNote" style="display:inline"></label><span class="link" data-module="notes"><%- Resources.anRepName %></span></td></tr>
            </tbody>
        </table>
    </div>
    <br />
</div>