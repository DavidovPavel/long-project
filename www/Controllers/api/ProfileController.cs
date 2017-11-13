using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Http;
using Newtonsoft.Json.Linq;
using www.Models;
using www.SaGateway;

namespace www.Controllers.api
{
    public class ProfileController : ApiController
    {
        [HttpGet]
        [ActionName("DefaultAction")]
        public IEnumerable<SearchProfile> Get()
        {
            var profiles = WebSaUtilities.MBF.GetProfiles();

            return profiles
                .OrderBy(item => item.ProfileName)
                .Select(item =>
                            new SearchProfile
                                {
                                    ProfileID = item.ProfileId,
                                    IsDefault = item.IsDefault,
                                    title = item.ProfileName,
                                    MBFTaskTypes = item.Types.ToList(),
                                    isCommon = item.IsCommon
                                });
        }

        [ActionName("DefaultAction")]
        [Route("api/profile/alltasktypes")]
        public IEnumerable<TaskTypeByCategoriesInfo> GetAllTaskTypes()
        {
            return SDKHelper.Search_GetAllRobots().OrderBy(item => item.title);
        }

        [HttpGet]
        public SearchProfile Item(int id)
        {
            var profile = WebSaUtilities.MBF.GetProfileBy(id);
            if (profile != null)
                return new SearchProfile
                {
                    ProfileID = profile.ProfileId,
                    MBFTaskTypes = profile.Types.ToList(),
                    title = profile.ProfileName,
                    IsDefault = profile.IsDefault,
                    isCommon = profile.IsCommon
                };

            return null;
        }

        [ActionName("DefaultAction")]
        public SearchProfile Post(object value)
        {

            var jObject = value as JObject;
            if (jObject != null)
            {
                var title = jObject.Property("title").Value.ToString();
                var profile = new ANBR.Monitoring.TypesProfile
                                  {
                                      ProfileId = -1,
                                      IsDefault = false,
                                      Types = new List<Guid>(),
                                      ProfileName = title
                                  };
                var _id = WebSaUtilities.MBF.SaveProfile(profile);
            
                return new SearchProfile
                           {
                               ProfileID = _id,
                               IsDefault = false,
                               title = title,
                               MBFTaskTypes = new List<Guid>(),
                               isCommon = false
                           };
            }
            return null;
        }

        [ActionName("DefaultAction")]
        public string Put(object value)
        {
            var jObject = value as JObject;
            if (jObject != null && jObject.Count != 0)
            {
                var title = jObject.Property("title").Value.ToString();
                var nid = (int)jObject.Property("ProfileID").Value;
                var profile = WebSaUtilities.MBF.GetProfileBy(nid);

                if (!string.IsNullOrWhiteSpace(title))
                    profile.ProfileName = title;

                var arr = jObject.Property("MBFTaskTypes").Value.Select(x => Guid.Parse(x.Value<string>())).ToList();
                profile.Types = arr;
                profile.ProfileId = nid;
                WebSaUtilities.MBF.SaveProfile(profile);

            }
            return "done";
        }

        [ActionName("DefaultAction")]
        public void Delete(int id)
        {
            WebSaUtilities.MBF.RemoveProfileBy(id);
        }
    }
}
